import { sheets, auth } from "@googleapis/sheets"
import { drive } from '@googleapis/drive'
import { BookingType, EventType, FoundUserResponseType, ParticipantType, RoleType, UserDriveTokensType, UserType, table } from "./onetable.js"
import { filterDataByRoles } from "./roles.js"
import { Fields, CSVCurrent } from "../shared/participantFields.js"

const EventModel = table.getModel<EventType>('Event')
const RoleModel = table.getModel<RoleType>('Role')
const UserDriveTokensModel = table.getModel<UserDriveTokensType>('UserDriveTokens')
const BookingModel = table.getModel<BookingType>('Booking')
const UserModel = table.getModel<UserType>('User')

export async function syncEventToDrive(eventId, config) {
    const event = await EventModel.get({ id: eventId })
    const roles = await RoleModel.find({ sk: { begins: eventId } })
    const users = await UserModel.scan()
    for (const user of users) {
        if (!user.tokens) continue
        const userRoles = roles.filter(r => r.userId === user.id)
        if (userRoles.length > 0) {
            const BookingModel = table.getModel<BookingType>('Booking')
            const bookings = await BookingModel.find({ sk: { begins: `event:${eventId}:version` } }) as BookingType[]
            const filtered = filterDataByRoles(event!, bookings, { roles: userRoles, ...user, tokens: !!user.tokens })
            const participants = getParticipantRecords(filtered)
            try {
                await syncToDrive(event!, user.tokens, participants, config)
                console.log(`Synced drive for ${user.userName} event ${event?.name}`)
            } catch (e: any) {
                if (e.code === 401) {
                    await UserModel.update({ remoteId: user.remoteId }, { remove: ['tokens'] })
                    return
                } else {
                    console.log(`ERROR syncing drive for ${user.userName} event ${event?.name}`)
                    console.log(e)
                    throw e
                }
            }
        }
    }
}

type CSVParticipant = ParticipantType & {current: boolean}

function getParticipantRecords(bookings: BookingType[]): CSVParticipant[] {
    bookings.sort((a,b) => a.version.localeCompare(b.version!))
    console.log(bookings)
    const participants: Record<string, CSVParticipant> = {}
    for(const booking of bookings) {
        for(const participant of booking.participants){
            participants[participant.created.toISOString()] = {...participant, current: booking.version === "latest"}
        }
    }

    const result: CSVParticipant[] = []

    for(const [key, participant] of Object.entries(participants))
        result.push(participant)

    return result.sort((a, b) => a.created.getTime() - b.created.getTime())
}

async function syncToDrive(event: EventType, tokens: object, data, config) {
    const oauth2Client = new auth.OAuth2(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        `${config.BASE_URL}api/auth/google_drive/callback`
    );

    oauth2Client.setCredentials(tokens)

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

    const fields = new Fields(event)
    fields.fields.push(new CSVCurrent(event))

    const headers = fields.getCSVHeaders()
    const participants = data.map(p => fields.getCSVValues(p))
    
    await sheets_instance.spreadsheets.values.batchUpdate({ spreadsheetId: sheetId, requestBody: { valueInputOption: "RAW", data: [{ range: "Sheet1!A1", values: [headers, ...participants] }] } })
    //await sheets_instance.spreadsheets.values.batchUpdate({spreadsheetId: sheetId, requestBody: {data: {range:"Sheet1!A1", values:[headers]}}})
}
