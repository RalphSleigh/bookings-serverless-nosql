import { sheets, auth, sheets_v4 } from "@googleapis/sheets"
import { drive, drive_v3 } from '@googleapis/drive'
import { BookingType, JsonBookingType, JsonParticipantType, OnetableEventType, UserType } from "./onetable.js";
import { th } from "date-fns/locale";
import { KpStructure } from "../shared/kp/kp_class.js";
import { parse } from "date-fns";
import { parseDate } from "../shared/util.js";
import { ResetTvOutlined } from "@mui/icons-material";


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
        ['https://www.googleapis.com/auth/drive.file'],
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
        const rootFolder = await drive_instance.files.list({ q: `name = 'shared_sheets' and mimeType = 'application/vnd.google-apps.folder' and trashed = false` })
        if (!rootFolder.data?.files?.[0]) throw new Error("Root folder not found")

        const eventFolder = await drive_instance.files.list({ q: `name = '${event.id}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolder.data.files[0].id}' in parents and trashed = false` })
        if (!eventFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFolder = await drive_instance.files.list({ q: `name = '${user.id}' and mimeType = 'application/vnd.google-apps.folder' and '${eventFolder.data.files[0].id}' in parents and trashed = false` })
        if (!userFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFile = await drive_instance.files.list({ q: `'${userFolder.data.files[0].id}' in parents and trashed = false`, fields: 'files(id, name, webViewLink)' })
        if (!userFile.data?.files?.[0]) return false
        return userFile.data.files[0]
    } catch (e) {
        return false
    }
}

export async function createSheetForBooking(config, event: OnetableEventType, user: UserType, basic: JsonBookingType["basic"]) {

    if (!basic.contactEmail || !basic.contactName || !basic.district) throw new Error("Need basic infomation")

    const drive_instance = await getDriveClient(config)
    try {

        const sheet = await getHasSheet(config, event, user)

        if (sheet) return sheet

        const rootFolder = await drive_instance.files.list({ q: `name = 'shared_sheets' and mimeType = 'application/vnd.google-apps.folder'` })
        if (!rootFolder.data?.files?.[0]) throw new Error("Root folder not found")


        let eventFolderId: string | undefined | null
        const eventFolder = await drive_instance.files.list({ q: `name = '${event.id}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolder.data.files[0].id}' in parents and trashed = false` })
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
        const userFolder = await drive_instance.files.list({ q: `name = '${user.id}' and mimeType = 'application/vnd.google-apps.folder' and '${eventFolderId}' in parents and trashed = false` })
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

        const sheets_instance = await getSheetsClient(config)

        //@ts-ignore
        const update = await sheets_instance.spreadsheets.batchUpdate({
            spreadsheetId: newSheet.data.id!,
            requestBody: {
                requests: [
                    {
                        updateCells: {
                            start: {
                                "sheetId": 0,
                                "rowIndex": 0,
                                "columnIndex": 0
                            },
                            rows: [{
                                values: ['Name', 'Email', 'Date of Birth', 'Attendance', 'Dietary Requirements', 'Dietary Details', 'Dietary Preferences', 'Nut Free', 'Gluten Free', 'Soya Free', 'Dairy Free', 'Egg Free', 'Pork Free', 'Chickpea Free', 'Diabetic', 'Contact Me', 'Photo Consent', 'RSE Consent', 'Medical Details'].map(v => { return { userEnteredValue: { stringValue: v } } })
                            }],
                            fields: "userEnteredValue.stringValue"
                        }
                    },
                    {
                        repeatCell: {
                            range: {
                                "sheetId": 0,
                                "startRowIndex": 1,
                                "startColumnIndex": 1,
                                "endColumnIndex": 2
                            },
                            cell: { dataValidation: { condition: { type: "TEXT_IS_EMAIL" } } },
                            fields: "dataValidation"
                        }
                    },
                    {
                        repeatCell: {
                            range: {
                                "sheetId": 0,
                                "startRowIndex": 1,
                                "startColumnIndex": 2,
                                "endColumnIndex": 3
                            },
                            cell: { userEnteredFormat: { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } }, dataValidation: { condition: { type: "DATE_IS_VALID" } } },
                            fields: "userEnteredFormat.numberFormat,dataValidation"
                        }
                    },
                    {
                        repeatCell: {
                            range: {
                                "sheetId": 0,
                                "startRowIndex": 1,
                                "startColumnIndex": 3,
                                "endColumnIndex": 4
                            },
                            cell: { dataValidation: { condition: { type: "ONE_OF_LIST", values: event.attendanceData?.options?.map(o => { return { userEnteredValue: o } }) }, showCustomUi: true } },
                            fields: "dataValidation"
                        }
                    },
                    {
                        repeatCell: {
                            range: {
                                "sheetId": 0,
                                "startRowIndex": 1,
                                "startColumnIndex": 4,
                                "endColumnIndex": 5
                            },
                            cell: { dataValidation: { condition: { type: "ONE_OF_LIST", values: KpStructure.dietOptions.map(d => { return { userEnteredValue: d } }) }, showCustomUi: true } },
                            fields: "dataValidation"
                        }
                    },
                    {
                        repeatCell: {
                            range: {
                                "sheetId": 0,
                                "startRowIndex": 1,
                                "startColumnIndex": 7,
                                "endColumnIndex": 16
                            },
                            cell: { dataValidation: { condition: { type: "ONE_OF_LIST", values: [{ userEnteredValue: "Yes" }, { userEnteredValue: "No" }] }, showCustomUi: true } },
                            fields: "dataValidation"
                        },

                    },
                    {
                        repeatCell: {
                            range: {
                                "sheetId": 0,
                                "startRowIndex": 1,
                                "startColumnIndex": 16,
                                "endColumnIndex": 18
                            },
                            cell: { dataValidation: { condition: { type: "ONE_OF_LIST", values: [{ userEnteredValue: "Yes" }, { userEnteredValue: "No" }] }, showCustomUi: true } },
                            fields: "dataValidation"
                        },
                    }
                ],
            }
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

export async function getParticipantsFromSheet(config, event: OnetableEventType, user: UserType): Promise<Partial<JsonParticipantType>[]> {
    const drive_instance = await getDriveClient(config)

    let sheet: drive_v3.Schema$File

    try {
        const rootFolder = await drive_instance.files.list({ q: `name = 'shared_sheets' and mimeType = 'application/vnd.google-apps.folder' and trashed = false` })
        if (!rootFolder.data?.files?.[0]) throw new Error("Root folder not found")

        const eventFolder = await drive_instance.files.list({ q: `name = '${event.id}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolder.data.files[0].id}' in parents and trashed = false` })
        if (!eventFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFolder = await drive_instance.files.list({ q: `name = '${user.id}' and mimeType = 'application/vnd.google-apps.folder' and '${eventFolder.data.files[0].id}' in parents and trashed = false` })
        if (!userFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFile = await drive_instance.files.list({ q: `'${userFolder.data.files[0].id}' in parents and trashed = false`, fields: 'files(id, name, webViewLink)' })
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

    if (!response.data.values) throw new Error("No data found")

    const participants = response.data.values.slice(1).filter(row => row[0]).map(row => getParticipantFromRow(row, event))

    console.log(participants)

    return participants


}

function getParticipantFromRow(row: NonNullable<sheets_v4.Schema$ValueRange["values"]>[number], event: OnetableEventType): Partial<JsonParticipantType> {
    const result: Partial<JsonParticipantType> = {
        basic: {
            name: row[0],
            email: row[1],
            dob: toUtcDate(parse(row[2], 'yyyy-MM-dd', new Date(2000, 0, 1, 0, 0, 0, 0)))!.toISOString(),
        },
        attendance: {    
        },
        kp: {
            diet: row[4],
            details: row[5],
            preferences: row[6],
            nuts: row[7] === "Yes",
            gluten: row[8] === "Yes",
            soya: row[9] === "Yes",
            dairy: row[10] === "Yes",
            egg: row[11] === "Yes",
            pork: row[12] === "Yes",
            chickpea: row[13] === "Yes",
            diabetic: row[14] === "Yes",
            contactMe: row[15] === "Yes",
        },
        medical: {
            details: row[18] || "",
        },
        consent: {}
    }

    const attendance = event.attendanceData?.options?.findIndex(o => o === row[3])

    if(typeof attendance == "number" && attendance > -1) result.attendance!.option = attendance

    if (row[16]) result.consent!.photo = row[16] === "Yes"
    if (row[17]) result.consent!.sre = row[17] === "Yes"

    return result
}

export function toUtcDate(date: Date | string | undefined): Date | null {

    let localDate = parseDate(date)
    if (!localDate) return null

    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
}