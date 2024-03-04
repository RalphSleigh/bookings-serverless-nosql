import { sheets, auth } from "@googleapis/sheets"
import { drive } from '@googleapis/drive'
import { BookingType, EventType, FoundUserResponseType, OnetableEventType, ParticipantType, RoleType, UserType, UserWithRoles, table } from "./onetable.js"
import { filterDataByRoles } from "./roles.js"
import { ParticipantFields, CSVCurrent } from "../shared/participantFields.js"
import { User } from "discord.js"
import { ConfigType } from "./config.js"
import { log } from "./logging.js"
import am_in_lambda from "./am_in_lambda.js"
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"
import { addComputedFieldsToBookingsQueryResult } from "../shared/util.js"

const EventModel = table.getModel<OnetableEventType>('Event')
const RoleModel = table.getModel<RoleType>('Role')
const BookingModel = table.getModel<BookingType>('Booking')
const UserModel = table.getModel<UserType>('User')

export async function queueDriveSync(eventId: string, config: ConfigType) {
    log(`queueing drive sync for ${eventId}`)

    if (!config.DRIVE_SYNC_ENABLED) {
        log(`Not syncing drive for ${eventId} as drive sync is disabled`)
        return true
    }
    else if (am_in_lambda()) {
        log(`Syncing drive for ${eventId} via lambda`)
        await triggerDriveSyncSQS(eventId)
    } else {
        log(`Syncing drive for ${eventId}`)
        syncEventToDrive(eventId, config)
    }
}

async function triggerDriveSyncSQS(eventId: string) {
    console.log("putting message in queue- drive sync")
    const sqsClient = new SQSClient({});
    const body = JSON.stringify({ eventId })
    console.log(body)
    const command = new SendMessageCommand({
        QueueUrl: process.env.DRIVE_SYNC_QUEUE_URL,
        MessageBody: body
    });

    await sqsClient.send(command);
}

export async function syncEventToDrive(eventId, config) {
    const event = await EventModel.get({ id: eventId })
    const roles = await RoleModel.find({ sk: { begins: eventId } })
    const users = await UserModel.scan()
    const bookings = await BookingModel.find({ sk: { begins: `event:${eventId}:version` } }) as BookingType[]
    const betterBookings = addComputedFieldsToBookingsQueryResult(bookings, event)
    if (event) {
        for (const user of users) {
            if (!user.tokens) continue
            const userRoles = roles.filter(r => r.userId === user.id)
            if (userRoles.length > 0) {
                const fullUser: UserWithRoles = { roles: userRoles, ...user }
                const filtered = filterDataByRoles(event, betterBookings, fullUser)
                const participants = getParticipantRecords(filtered)
                try {
                    await syncToDrive(event, fullUser, participants, config)
                    console.log(`Synced drive for ${user.userName} event ${event.name}`)
                } catch (e: any) {
                    if (e.code === 401) {
                        await UserModel.update({ remoteId: user.remoteId }, { remove: ['tokens'] })
                    } else {
                        console.log(`ERROR syncing drive for ${user.userName} event ${event?.name}`)
                        console.log(e)
                    }
                }
            }
        }
    }
}

type CSVParticipant = ParticipantType & { current: boolean }

function getParticipantRecords(bookings: BookingType[]): CSVParticipant[] {
    bookings.sort((a, b) => a.version.localeCompare(b.version!))
    //console.log(bookings)
    const participants: Record<string, CSVParticipant> = {}
    for (const booking of bookings) {
        for (const participant of booking.participants) {
            const key = participant.created.toISOString()
            if (participants[key]) {
                console.log(`Updating participant ${key}`)
            } else {
                console.log(`Creating participant ${key}`)
            }
            participants[participant.created.toISOString()] = { ...participant, current: booking.version === "latest" && !booking.deleted }
        }
    }

    const result: CSVParticipant[] = []

    for (const [key, participant] of Object.entries(participants))
        result.push(participant)

    return result.sort((a, b) => a.created.getTime() - b.created.getTime())
}

async function syncToDrive(event: OnetableEventType, user: UserWithRoles, data, config) {
    const oauth2Client = new auth.OAuth2(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        `${config.BASE_URL}api/auth/google_drive/callback`
    );

    oauth2Client.setCredentials(user.tokens!)

    const sheets_instance = sheets({ version: 'v4', auth: oauth2Client })
    //@ts-ignore
    const drive_instance = drive({ version: 'v3', auth: oauth2Client })

    const name = `${event.name} - Synced Data`

    const list = await drive_instance.files.list({
        q: `mimeType='application/vnd.google-apps.spreadsheet' and name='${name}'`,
        fields: 'files(id, name)'
    })

    let sheetId

    if (list.data.files?.length === 0) {
        const sheet = await sheets_instance.spreadsheets.create({ requestBody: { properties: { title: name } }, fields: 'spreadsheetId' })
        sheetId = sheet.data.spreadsheetId
    } else {
        sheetId = list.data.files?.[0].id
    }
    console.log(sheetId)

    const fields = new ParticipantFields(event)
    fields.fields.push(new CSVCurrent(event))

    const headers = fields.getCSVHeaders(user)
    const participants = data.map(p => fields.getCSVValues(p, user))


    await sheets_instance.spreadsheets.values.batchUpdate({ spreadsheetId: sheetId, requestBody: { valueInputOption: "RAW", data: [{ range: "Sheet1!A1", values: [headers, ...participants] }] } })
    //await sheets_instance.spreadsheets.values.batchUpdate({spreadsheetId: sheetId, requestBody: {data: {range:"Sheet1!A1", values:[headers]}}})
}
