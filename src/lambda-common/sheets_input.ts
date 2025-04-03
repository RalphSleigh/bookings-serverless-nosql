import { sheets, auth, sheets_v4 } from "@googleapis/sheets"
import { drive, drive_v3 } from '@googleapis/drive'
import { BookingType, FoundUserResponseType, JsonBookingType, JsonParticipantType, OnetableEventType, UserType } from "./onetable.js";
import { fi, th } from "date-fns/locale";
import { KpStructure } from "../shared/kp/kp_class.js";
import { parse } from "date-fns";
import { parseDate } from "../shared/util.js";
import { ResetTvOutlined } from "@mui/icons-material";
import { ConfigType } from "./config.js";
import { query } from "express";


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

export async function getHasSheet(config, event: OnetableEventType, user: FoundUserResponseType) {
    const drive_instance = await getDriveClient(config)

    try {
        const rootFolder = await drive_instance.files.list({ q: `name = 'shared_sheets' and mimeType = 'application/vnd.google-apps.folder' and trashed = false` })
        if (!rootFolder.data?.files?.[0]) throw new Error("Root folder not found")

        const eventFolder = await drive_instance.files.list({ q: `name contains '${event.id}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolder.data.files[0].id}' in parents and trashed = false` })
        if (!eventFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFolder = await drive_instance.files.list({ q: `name contains '${user.id}' and mimeType = 'application/vnd.google-apps.folder' and '${eventFolder.data.files[0].id}' in parents and trashed = false` })
        if (!userFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFile = await drive_instance.files.list({ q: `'${userFolder.data.files[0].id}' in parents and trashed = false`, fields: 'files(id, name, webViewLink)' })
        if (!userFile.data?.files?.[0]) return false
        return userFile.data.files[0]
    } catch (e) {
        return false
    }
}

export async function createSheetForBooking(config: ConfigType, event: OnetableEventType, user: UserType, basic: JsonBookingType["basic"], locales: string[]) {

    if (!basic.contactEmail || !basic.contactName || !basic.district) throw new Error("Need basic infomation")

    const drive_instance = await getDriveClient(config)
    try {

        const sheet = await getHasSheet(config, event, user)

        if (sheet) return sheet

        const rootFolder = await drive_instance.files.list({ q: `name = 'shared_sheets' and mimeType = 'application/vnd.google-apps.folder'` })
        if (!rootFolder.data?.files?.[0]) throw new Error("Root folder not found")


        let eventFolderId: string | undefined | null
        const eventFolder = await drive_instance.files.list({ q: `name contains '${event.id}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolder.data.files[0].id}' in parents and trashed = false` })
        if (eventFolder.data?.files?.[0]) {
            eventFolderId = eventFolder.data.files[0].id
        } else {
            const newEventFolder = await drive_instance.files.create({
                requestBody: {
                    name: `${config.BASE_URL} - ${event.name} (${event.id})`,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [rootFolder.data.files[0].id!],
                },
                fields: 'id'
            })
            eventFolderId = newEventFolder.data.id
        }


        let userFolderId: string | undefined | null
        const userFolder = await drive_instance.files.list({ q: `name contains '${user.id}' and mimeType = 'application/vnd.google-apps.folder' and '${eventFolderId}' in parents and trashed = false` })
        if (userFolder.data?.files?.[0]) {
            userFolderId = userFolder.data.files[0].id
        } else {
            const newUserFolder = await drive_instance.files.create({
                requestBody: {
                    name: `${basic.district} - ${user.userName} (${user.id})`,
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
                requests: [{
                    updateCells: {
                        start: {
                            "sheetId": 0,
                            "rowIndex": 0,
                            "columnIndex": 0
                        },
                        rows: [{
                            values: ['Name', 'Email', 'Date of Birth', 'Attendance', 'Dietary Requirements', 'Dietary Details', 'Dietary Preferences', 'Nut Free', 'Gluten Free', 'Soya Free', 'Dairy Free', 'Egg Free', 'Pork Free', 'Chickpea Free', 'Diabetic', 'Complicated Needs - Contact Me', 'Photo Consent', 'RSE Consent (12 - 17 only)', 'Medical Details', "Accessbility Details", "Accessbility Contact Me", "First Aid"].map(v => { return { userEnteredValue: { stringValue: v } } })
                        }],
                        fields: "userEnteredValue.stringValue"
                    }
                },
                {
                    repeatCell: {
                        range: {
                            "sheetId": 0,
                            "startRowIndex": 0,
                            "startColumnIndex": 0,
                            "endRowIndex": 1
                        },
                        cell: { userEnteredFormat: { textFormat: { bold: true }, borders: { bottom: { style: "SOLID" } } } },
                        fields: "userEnteredFormat"
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
                        cell: { dataValidation: { condition: { type: "DATE_IS_VALID" } } },
                        fields: "dataValidation"
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
                        cell: { dataValidation: { condition: { type: "BOOLEAN", values: [{ userEnteredValue: "Yes" }, { userEnteredValue: "No" }] }, showCustomUi: true } },
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
                },
                {
                    repeatCell: {
                        range: {
                            "sheetId": 0,
                            "startRowIndex": 1,
                            "startColumnIndex": 20,
                            "endColumnIndex": 22
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
                            "startColumnIndex": 5,
                            "endColumnIndex": 16
                        },
                        cell: { userEnteredFormat: { backgroundColor: { red: 0.93, blue: 0.93, green: 0.93, alpha: 1 } } },
                        fields: "userEnteredFormat"
                    },
                },
                {
                    repeatCell: {
                        range: {
                            "sheetId": 0,
                            "startRowIndex": 1,
                            "startColumnIndex": 18,
                            "endColumnIndex": 22
                        },
                        cell: { userEnteredFormat: { backgroundColor: { red: 0.93, blue: 0.93, green: 0.93, alpha: 1 } } },
                        fields: "userEnteredFormat"
                    },
                },
                {
                    addProtectedRange: {
                        protectedRange: {
                            range: {
                                "sheetId": 0,
                                "startRowIndex": 0,
                                "endRowIndex": 1,
                                "startColumnIndex": 0,
                            },
                            description: "Protect all except the first row",
                            warningOnly: false,
                            requestingUserCanEdit: false,
                            editors: {
                                users: [config.EMAIL_FROM]
                            }
                        }
                    }
                }
                ],
            }
        })

        for (let locale of locales) {
            try {
                //@ts-ignore
                await sheets_instance.spreadsheets.batchUpdate({
                    spreadsheetId: newSheet.data.id!,
                    requestBody: {
                        requests: [{
                            updateSpreadsheetProperties: {
                                properties: {
                                    "locale": locale.replaceAll("-", "_"),
                                },
                                fields: "locale"
                            }
                        }]
                    }
                })
                break
            } catch (e) {
                console.log(e)
            }
        }

        await drive_instance.permissions.create({
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
        console.log(e)
        return false
    }
}

const promiseCache = {}

const cachedPromise = (key, fn) => {
    if (!promiseCache[key]) {
        promiseCache[key] = fn()
    }
    return promiseCache[key]
}

export async function getParticipantsFromSheet(config, event: OnetableEventType, user: FoundUserResponseType): Promise<Partial<JsonParticipantType>[]> {
    const drive_instance = await cachedPromise("client", () => getDriveClient(config))

    let sheet: drive_v3.Schema$File

    try {
        const rootFolder = await cachedPromise("root", () => drive_instance.files.list({ q: `name = 'shared_sheets' and mimeType = 'application/vnd.google-apps.folder' and trashed = false` }))
        if (!rootFolder.data?.files?.[0]) throw new Error("Root folder not found")

        const eventFolder = await cachedPromise(event.id, () => drive_instance.files.list({ q: `name contains '${event.id}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolder.data.files[0].id}' in parents and trashed = false` }))
        if (!eventFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFolder = await cachedPromise(`${event.id}${user.id}`, () => drive_instance.files.list({ q: `name contains '${user.id}' and mimeType = 'application/vnd.google-apps.folder' and '${eventFolder.data.files[0].id}' in parents and trashed = false` }))
        if (!userFolder.data?.files?.[0]) throw new Error("Event folder not found")

        const userFile = await cachedPromise (`${event.id}${user.id}sheetfile`, () => drive_instance.files.list({ q: `'${userFolder.data.files[0].id}' in parents and trashed = false`, fields: 'files(id, name, webViewLink)' }))
        if (!userFile.data?.files?.[0]) throw new Error("Sheet not found")

        sheet = userFile.data.files[0]

    } catch (e) {
        throw new Error("Sheet not found")
    }

    const sheets_instance = await cachedPromise(`sheetsclient`, () => getSheetsClient(config))

    const response = await sheets_instance.spreadsheets.values.get({
        spreadsheetId: sheet.id!,
        range: 'Sheet1',
        valueRenderOption: 'UNFORMATTED_VALUE',
    })

    if (!response.data.values) throw new Error("No data found")

    const participants = response.data.values.slice(1).filter(row => row[0]).map(row => getParticipantFromRow(row, event))

    console.log(participants)

    return participants


}

function getParticipantFromRow(row: NonNullable<sheets_v4.Schema$ValueRange["values"]>[number], event: OnetableEventType): Partial<JsonParticipantType> {

    let dob: string = ""
    try {
        if (typeof row[2] !== "number") throw ("Invalid date")
        else
            dob = toUtcDate(ValueToDate(row[2]))!.toISOString()
    } catch (e) { }

    const result: Partial<JsonParticipantType> = {
        basic: {
            name: row[0],
            email: row[1],
            dob: dob
        },
        attendance: {
        },
        kp: {
            diet: row[4].toLowerCase(),
            details: row[5],
            preferences: row[6],
            nuts: row[7] === "Yes",
            gluten: row[8] === "Yes",
            soya: row[9] === "Yes",
            dairy: row[10] === "Yes" || row[4] === "vegan",
            egg: row[11] === "Yes" || row[4] === "vegan",
            pork: row[12] === "Yes" || (typeof row[4] == "string" && row[4] !== "omnivore" && row[4] !== ""),
            chickpea: row[13] === "Yes",
            diabetic: row[14] === "Yes",
            contactMe: row[15] === "Yes",
        },
        medical: {
            details: row[18] || "",
            accessibility: row[19] || "",
            contactMe: row[20] === "Yes",
            firstAid: row[21] === "Yes"
        },
        consent: {}
    }

    const attendance = event.attendanceData?.options?.findIndex(o => o === row[3])

    if (typeof attendance == "number" && attendance > -1) result.attendance!.option = attendance

    if (row[16]) result.consent!.photo = row[16] === "Yes"
    if (row[17]) result.consent!.sre = row[17] === "Yes"

    const removeEmpty = obj => Object.fromEntries(Object.keys(obj).filter(k => obj[k] !== '').map(k => [k, obj[k]]));

    result.kp = removeEmpty(result.kp)
    result.medical = removeEmpty(result.medical)


    return result
}

export function toUtcDate(date: Date | string | undefined): Date | null {

    let localDate = parseDate(date)
    if (!localDate) return null

    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
}

function ValueToDate(GoogleDateValue) {
    return new Date(new Date(1899, 11, 30 + Math.floor(GoogleDateValue), 0, 0, 0, 0).getTime() + (GoogleDateValue % 1) * 86400000);
}