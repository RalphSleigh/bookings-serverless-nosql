import { sheets, auth } from "@googleapis/sheets"
import { drive, drive_v3 } from '@googleapis/drive'
import { BookingType, JsonBookingType, OnetableEventType, UserType } from "./onetable.js";
import { th } from "date-fns/locale";


async function getGoogleDriveAuth(config) {
    const auth_client = new auth.JWT(
        config.EMAIL_CLIENT_EMAIL,
        '',
        config.EMAIL_PRIVATE_KEY,
        ['https://www.googleapis.com/auth/drive'],
        config.EMAIL_FROM
    );

    return auth_client
}

async function getDriveClient(config) {
    const auth_client = await getGoogleDriveAuth(config)
    return drive({ version: 'v3', auth: auth_client })
}

async function getGoogleSheetsAuth(config) {
    const auth_client = new auth.JWT(
        config.EMAIL_CLIENT_EMAIL,
        '',
        config.EMAIL_PRIVATE_KEY,
        ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        config.EMAIL_FROM
    );

    return auth_client
}

async function getSheetsClient(config) {
    const auth_client = await getGoogleSheetsAuth(config)
    return sheets({ version: 'v4', auth: auth_client })
}


export type HasSheetType = drive_v3.Schema$File | false

export async function getHasSheet(config, event: OnetableEventType, user: UserType) {
    const drive_instance = await getDriveClient(config)

    try {
        const rootFolder = await drive_instance.files.list({ q: `name = 'shared_sheets' and mimeType = 'application/vnd.google-apps.folder'` })
        if (!rootFolder.data?.files?.[0]) throw new Error("Root folder not found")

        const eventFolder = await drive_instance.files.list({ q: `name = '${event.id}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolder.data.files[0].id}' in parents` })
        if (!eventFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFolder = await drive_instance.files.list({ q: `name = '${user.id}' and mimeType = 'application/vnd.google-apps.folder' and '${eventFolder.data.files[0].id}' in parents` })
        if (!userFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFile = await drive_instance.files.list({ q: `'${userFolder.data.files[0].id}' in parents and trashed = false`, fields: 'files(id, name, webViewLink)'})
        if (!userFile.data?.files?.[0]) return false
        return userFile.data.files[0]
    } catch (e) {
        return false
    }
}

export async function createSheetForBooking(config, event: OnetableEventType, user:UserType, basic: JsonBookingType["basic"]) {
    
    if(!basic.contactEmail || !basic.contactName || !basic.district) throw new Error("Need basic infomation")
    
    const drive_instance = await getDriveClient(config)
    try {

        const sheet = await getHasSheet(config, event, user)

        if (sheet) return sheet

        const rootFolder = await drive_instance.files.list({ q: `name = 'shared_sheets' and mimeType = 'application/vnd.google-apps.folder'` })
        if (!rootFolder.data?.files?.[0]) throw new Error("Root folder not found")


        let eventFolderId: string | undefined | null
        const eventFolder = await drive_instance.files.list({ q: `name = '${event.id}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolder.data.files[0].id}' in parents` })
        if (eventFolder.data?.files?.[0]) {
            eventFolderId = eventFolder.data.files[0].id
        } else {
            const newEventFolder = await drive_instance.files.create({
                requestBody: {
                    name: event.id,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [rootFolder.data.files[0].id!],
                },
                fields: 'id'
            })
            eventFolderId = newEventFolder.data.id
        }


        let userFolderId: string | undefined | null
        const userFolder = await drive_instance.files.list({ q: `name = '${user.id}' and mimeType = 'application/vnd.google-apps.folder' and '${eventFolderId}' in parents` })
        if (userFolder.data?.files?.[0]) {
            userFolderId = userFolder.data.files[0].id
        } else {
            const newUserFolder = await drive_instance.files.create({
                requestBody: {
                    name: user.id,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [eventFolderId!],
                },
                fields: 'id'
            })
            userFolderId = newUserFolder.data.id
        }

        const newSheet = await drive_instance.files.create({
            requestBody: {
                name: `${basic.contactName} (${basic.district}) Campers for ${event.name}`,
                mimeType: 'application/vnd.google-apps.spreadsheet',
                parents: [userFolderId!],
            },
            fields: 'id, webViewLink'
        })

        drive_instance.permissions.create({
            fileId: newSheet.data.id!,
            emailMessage: `You can fill in this sheet with the details of your campers for ${event.name}, once you have filled it in, return to the booking form to import the data.`,
            requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: basic.contactEmail
            }
        })

        return newSheet.data
    } catch (e) {
        return false
    }
}

export async function getParticipantsFromSheet(config, event: OnetableEventType, user: UserType): Promise<BookingType["participants"]> {
    const drive_instance = await getDriveClient(config)

    let sheet: drive_v3.Schema$File

    try {
        const rootFolder = await drive_instance.files.list({ q: `name = 'shared_sheets' and mimeType = 'application/vnd.google-apps.folder'` })
        if (!rootFolder.data?.files?.[0]) throw new Error("Root folder not found")

        const eventFolder = await drive_instance.files.list({ q: `name = '${event.id}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolder.data.files[0].id}' in parents` })
        if (!eventFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFolder = await drive_instance.files.list({ q: `name = '${user.id}' and mimeType = 'application/vnd.google-apps.folder' and '${eventFolder.data.files[0].id}' in parents` })
        if (!userFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFile = await drive_instance.files.list({ q: `'${userFolder.data.files[0].id}' in parents and trashed = false`, fields: 'files(id, name, webViewLink)'})
        if (!userFile.data?.files?.[0]) throw new Error("Sheet not found")

        sheet = userFile.data.files[0]
    } catch (e) {
        throw new Error("Sheet not found")
    }

    const sheets_instance = await getSheetsClient(config)

    const response = await sheets_instance.spreadsheets.values.get({
        spreadsheetId: sheet.id!,
        range: 'Sheet1'
    })

    console.log(response.data)
}