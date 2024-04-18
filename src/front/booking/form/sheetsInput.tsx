import React, { useEffect } from "react";
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js";
import { useCreateSheet, useGetParticipantsFromSheet, useHasSheet } from "../../queries.js";
import { Alert, AlertTitle, Box, Paper, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { PostAdd, ListAlt, Download } from "@mui/icons-material";
import { HasSheetType } from "../../../lambda-common/sheets_input.js";
import { drive_v3 } from "@googleapis/drive";
import { getMemoUpdateFunctions } from "../../../shared/util.js";

export const SheetsWidget: React.FC<{ event: JsonEventType, basic: JsonBookingType["basic"], update: any }> = ({ event, basic, update }) => {

    const sheet = useHasSheet(event.id).data

    if (sheet.sheet === false) return <CreateSheetState event={event} basic={basic} />

    return <SheetExistsState event={event} sheet={sheet.sheet as drive_v3.Schema$File} update={update} />
}

const SheetExistsState: React.FC<{ event: JsonEventType, sheet: drive_v3.Schema$File, update: any }> = ({ event, sheet, update }) => {

    const getParticipantsDataMutation = useGetParticipantsFromSheet(event.id)

    const importFunction = e => {
        if (confirm("This will overwrite your current campers with data from the sheet, are you sure?")) {
            getParticipantsDataMutation.mutate()
        }
        e.preventDefault()
    }

    const updateParticipantsEffect = useEffect(() => {
        if (getParticipantsDataMutation.isSuccess) {
            update("participants")(p => {
                console.log(p)
                const newParticipants = getParticipantsDataMutation.data.participants.map((n, i) => {
                    n.created = p?.[i]?.created
                    n.updated = p?.[i]?.updated
                    return n
                })

                return newParticipants
            })
        }
    }, [getParticipantsDataMutation.isSuccess])

    return <Alert severity="success" sx={{ mt: 2 }} icon={<ListAlt />}>
        <AlertTitle>Spreadsheet Input</AlertTitle>
        Your sheet has been created and shared with your account. You can access it <a href={sheet.webViewLink!} target="_blank">here</a>. Once you have filled it in, click the button below to import your data.
        {getParticipantsDataMutation.isSuccess && <><br /><br />Data Imported, please resolve any validation errors and then submit the form.</>}
        <Box
            mt={1}
            //margin
            display="flex"
            justifyContent="flex-end"
            alignItems="flex-end">
            <LoadingButton
                sx={{ mt: 1 }}
                onClick={importFunction}
                endIcon={<Download />}
                loading={getParticipantsDataMutation.isPending}
                loadingPosition="end"
                variant="outlined"
                color="success">
                <span>Import Data</span>
            </LoadingButton>
        </Box>
    </Alert>
}

const CreateSheetState: React.FC<{ event: JsonEventType, basic: JsonBookingType["basic"] }> = ({ event, basic }) => {
    const createSheet = useCreateSheet(event.id)

    const createSheetFunction = e => {
        createSheet.mutate(basic)
        e.preventDefault()
    }

    const notGotNeededData = !basic.contactEmail || !basic.contactName || !basic.district

    return <Alert severity="success" sx={{ mt: 2 }} icon={<ListAlt />}>
        <AlertTitle>Spreadsheet Input</AlertTitle>
        Rather than filling in the form below with details of your campers, we can create you a Google Sheet to fill in and then import the data. This may be easier for larger groups. Clicking the button below will create a Google Sheet and share it with the email you have provided ({basic?.contactEmail}).
        <br /><br />
        Using this method will overwrite any data you have already entered on the form below.
        {notGotNeededData && <><br /><br />Please fill in your name, email and district to use this feature.</>}
        <Box
            mt={1}
            //margin
            display="flex"
            justifyContent="flex-end"
            alignItems="flex-end">
            <LoadingButton
                disabled={notGotNeededData}
                sx={{ mt: 1 }}
                onClick={createSheetFunction}
                endIcon={<PostAdd />}
                loading={createSheet.isPending}
                loadingPosition="end"
                variant="outlined"
                color="success">
                <span>Create Sheet</span>
            </LoadingButton>
        </Box>
    </Alert>
}
