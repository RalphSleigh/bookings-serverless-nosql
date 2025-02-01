import React, { useEffect, useState } from "react";
import { JsonBookingType, JsonEventType, JsonParticipantType } from "../../../lambda-common/onetable.js";
import { useCreateSheet, useGetParticipantsFromSheet, useHasSheet } from "../../queries.js";
import { Alert, AlertTitle, Box, LinearProgress, Paper, Typography, styled } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { PostAdd, ListAlt, Download } from "@mui/icons-material";
import { HasSheetType } from "../../../lambda-common/sheets_input.js";
import { drive_v3 } from "@googleapis/drive";
import { getMemoUpdateFunctions } from "../../../shared/util.js";

export const SheetsWidget: React.FC<{ event: JsonEventType, basic: JsonBookingType["basic"], update: any, setIncomingParticipants: any, readOnly: boolean }> = ({ event, basic, update, setIncomingParticipants, readOnly }) => {

    const sheet = useHasSheet(event.id).data

    if (sheet.sheet === false) return <CreateSheetState event={event} basic={basic} readOnly={readOnly}/>

    return <SheetExistsState event={event} sheet={sheet.sheet as drive_v3.Schema$File} update={update} setIncomingParticipants={setIncomingParticipants} readOnly={readOnly}/>
}

const chunk = (arr: any[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_: any, i: number) =>
        arr.slice(i * size, i * size + size)
    );

const SheetExistsState: React.FC<{ event: JsonEventType, sheet: drive_v3.Schema$File, update: any, setIncomingParticipants: any, readOnly: boolean }> = ({ event, sheet, update, setIncomingParticipants, readOnly }) => {

    const getParticipantsDataMutation = useGetParticipantsFromSheet(event.id)
    const [importProgress, setImportProgress] = useState(0)

    const importFunction = e => {
        if (confirm("This will overwrite your current campers with data from the sheet, are you sure?")) {
            getParticipantsDataMutation.mutate()
        }
        setImportProgress(0)
        e.preventDefault()
    }

    const SlowLinearProgress = styled(LinearProgress)({
        "& .MuiLinearProgress-bar": {
          // apply a new animation-duration to the `.bar` class
          animationDuration: "0.5s"
        }
      });

    const updateParticipantsEffect = useEffect(() => {
        if (getParticipantsDataMutation.isSuccess) {
            setIncomingParticipants(getParticipantsDataMutation.data.participants.length)
            const groups: Array<Array<JsonParticipantType>> = chunk(getParticipantsDataMutation.data.participants, 5)
            let oldParticipants
            update("participants")(p => {
                oldParticipants = (p || []).filter(p => p.created)
                return []
            })

            const handles = groups.map((g, i) => {
                return setTimeout((i => () => {
                    update("participants")(p => {
                        const newParticipants = g.map((n, j) => {
                            const existingByName = oldParticipants?.find(p => p.basic?.name === n.basic?.name)
                            n.created = existingByName?.created
                            n.updated = existingByName?.updated
                            oldParticipants = oldParticipants?.filter(p => p.created !== existingByName?.created)
                            return n
                        })

                        return [...p, ...newParticipants]
                    })
                    setImportProgress((i + 1) / groups.length * 100)
                })(i), i * 500)
            })

            if(handles.length == 0) setImportProgress(100)

            return () => {
                handles.forEach(h => clearTimeout(h))
            }
        }
    }, [getParticipantsDataMutation.isSuccess])

    return <Alert severity="success" sx={{ mt: 2 }} icon={<ListAlt />}>
        <AlertTitle>Spreadsheet Input</AlertTitle>
        Your sheet has been created and shared with your account. You can access it <a href={sheet.webViewLink!} target="_blank">here</a>.<br /><br /> Once you have filled it in, please click the button below to import your campers to the form. This will overwrite any existing data you have entered.
        {importProgress == 100 && getParticipantsDataMutation.isSuccess && <><br /><br />Data Imported, please resolve any validation issues and then <b>submit the form.</b></>}
        <Box
            mt={1}
            //margin
            display="flex"
            alignItems="center">
            <Box sx={{ flexGrow: 1, pr: 2, }}>
                {(getParticipantsDataMutation.isPending || getParticipantsDataMutation.isSuccess && importProgress == 0) && <LinearProgress variant="indeterminate" />}
                {getParticipantsDataMutation.isSuccess && importProgress > 0 && importProgress < 100 && <SlowLinearProgress variant="determinate" value={importProgress} />}
            </Box>
            <LoadingButton
                sx={{ mt: 1 }}
                onClick={importFunction}
                endIcon={<Download />}
                loading={getParticipantsDataMutation.isPending || (getParticipantsDataMutation.isSuccess && importProgress < 100)}
                loadingPosition="end"
                variant="outlined"
                color="success"
                disabled={readOnly}>
                <span>Import Campers to Form</span>
            </LoadingButton>
        </Box>
    </Alert>
}

const CreateSheetState: React.FC<{ event: JsonEventType, basic: JsonBookingType["basic"], readOnly: boolean }> = ({ event, basic, readOnly }) => {
    const createSheet = useCreateSheet(event.id)

    const createSheetFunction = e => {
        createSheet.mutate(basic)
        e.preventDefault()
    }

    const notGotNeededData = !basic.contactEmail || !basic.contactName || !basic.district

    return <Alert severity="success" sx={{ mt: 2 }} icon={<ListAlt />}>
        <AlertTitle>Spreadsheet Input</AlertTitle>
        Rather than filling in the form below with details of your campers, we can create you a Google Sheet to fill in and then import the data. This may be easier for larger groups. Clicking the button below will create a Google Sheet and share it with the email you have provided: 
        <br /><br />
        <b style={{fontSize:"110%"}}>{basic?.contactEmail}</b>
        <br /><br />
        Using this method will overwrite any data you have already entered on the form below.
        {notGotNeededData && <><br />Please fill in your name, email and district to use this feature.</>}
        <Box
            mt={1}
            //margin
            display="flex"
            justifyContent="flex-end"
            alignItems="flex-end">
            <LoadingButton
                disabled={notGotNeededData || readOnly}
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
