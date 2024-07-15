import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { JsonEventType, JsonParticipantType, JsonUserResponseType } from "../../lambda-common/onetable.js";
import { managePageContext } from "./managePage.js";
import { Box, Button, Grid, MenuItem, Modal, Paper, Typography } from "@mui/material";
import { ParticipantFields } from "../../shared/participantFields.js";
import { DataGrid, GridCallbackDetails, GridColumnVisibilityModel, GridRowParams, MuiEvent, GridToolbar, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarExport, GridToolbarExportContainer, GridPrintExportMenuItem, useGridApiContext, GridExportMenuItemProps } from "@mui/x-data-grid";
import { JsonParticipantWithExtraType } from "../../shared/computedDataTypes.js";
import { UserContext } from "../user/userContext.js";
import { format } from "date-fns";
import { stringify } from 'csv-stringify/browser/esm/sync';
import save from 'save-file'
import { capitalizeWord, parseDate } from "../../shared/util.js";
import { useStickyState } from "../util.js";
import { ageGroups, groupParticipants } from "../../shared/woodcraft.js";
import { getKP } from "../../shared/kp/kp.js";
import { getConsent } from "../../shared/consents/consent.js";
import { dataTagSymbol } from "@tanstack/react-query";

export function Component() {
    const { event, bookings, displayDeleted } = useOutletContext<managePageContext>()
    const user = useContext(UserContext)!
    const [selectedParticipant, setSelectedParticipant] = React.useState<number | undefined>(undefined)


    const participants = bookings.filter(b => !b.deleted || displayDeleted).reduce<JsonParticipantWithExtraType[]>((a, c) => {
        return [...a, ...c.participants]
    }, [])

    const fields = new ParticipantFields(event)

    const columns = fields.getColumnDefs(user)

    const [columnVisibilityModel, setColumnVisibilityModel] =
        useStickyState<GridColumnVisibilityModel>(fields.getDefaultColumnVisibility(user), `paricipant-columns-${event.id}`);

    const rows = useMemo(() => participants.map((p, i) => {
        return { participant: p, id: i }
    }), [participants])

    const onRowClick = useCallback((params: GridRowParams, event: MuiEvent, details: GridCallbackDetails) => {
        setSelectedParticipant(params.row.id)
    }, [participants])

    const totalsString = groupParticipants(participants, event).filter(g => g.participants.length > 0).map(g => `${g.group.name}: ${g.participants.length}`).join(", ")

    return <>
        <Grid xs={12} p={2} item>
            <ParticipantModal event={event} selectedParticipant={selectedParticipant} participant={typeof selectedParticipant == "number" ? participants[selectedParticipant] : undefined} handleClose={() => setSelectedParticipant(undefined)} />
            <Typography variant="body1"><b>Total: {participants.length}</b> {totalsString}</Typography>
            <DataGrid
                rowSelection={false}
                pageSizeOptions={[100]}
                rows={rows}
                columns={columns}
                onRowClick={onRowClick}
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={(newModel) =>
                    setColumnVisibilityModel(newModel)}
                getRowClassName={(params) => `participant-row-deleted-${params.row.participant.booking.deleted}`}
                slots={{ toolbar: CustomToolbar(() => saveCSV(event, user, participants)) }} />
        </Grid></>
}

const CustomToolbar = (saveCSV) => () => {
    return (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector />
            <GridToolbarExportContainer>
                <GridPrintExportMenuItem />
                <CSVExportMenuItem saveCSV={saveCSV} />
            </GridToolbarExportContainer>
        </GridToolbarContainer>
    );
}


const CSVExportMenuItem: React.FC<GridExportMenuItemProps<{}> & { saveCSV: () => void }> = (props) => {
    const { hideMenu, saveCSV } = props;
    return (
        <MenuItem
            onClick={() => {
                saveCSV();
                hideMenu?.();
            }}>
            Export CSV
        </MenuItem>
    );
}


const ParticipantModal = ({ event, selectedParticipant, participant, handleClose }: { event: JsonEventType, selectedParticipant: number | undefined, participant: JsonParticipantWithExtraType | undefined, handleClose: () => void }) => {
    const style = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        p: 2,
        outline: 'none'
    }

    if (!participant) return null

    const noWrap = { whiteSpace: 'nowrap' as 'nowrap', mt: 1 }
    const kp = getKP(event)
    const consent = getConsent(event)

    return (<Modal
        open={selectedParticipant !== undefined}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description">
        <Paper elevation={6} sx={style}>
            <Typography id="modal-modal-title" variant="h6">
                {participant?.basic?.name}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm>
                    <Typography variant="body1" sx={noWrap}><b>DoB:</b>&nbsp;{format(parseDate(participant.basic.dob)!, "dd-MM-yyyy")}:&nbsp;{participant?.ageGroup.displayAgeGroup(participant.age)}</Typography>
                    <Typography variant="body1" sx={noWrap}>
                        <b>Booked By:</b><br /> {participant.booking.basic.contactName}<br />
                        <a href={`mailto:${participant.booking.basic.contactEmail}`}>{participant.booking.basic.contactEmail}</a><br />
                        <a href={`tel:${participant.booking.basic.contactPhone}`}>{participant.booking.basic.contactPhone}</a>
                    </Typography>
                    { participant.booking.emergency?.name || participant.booking.emergency?.phone ? <Typography variant="body1" sx={noWrap}>
                        <b>Emergency Contact:</b><br /> {participant.booking.emergency?.name}<br />
                        <a href={`tel:${participant.booking.emergency?.phone}`}>{participant.booking.emergency?.phone}</a>
                    </Typography> : null }
                    <consent.PaticipantCardElement data={participant} />
                    {event.bigCampMode && participant.medical && participant.age > 17 ? <Typography variant="body1" sx={noWrap}><b>First aid: </b> {participant.medical?.firstAid ? "✔️" : "❌"}</Typography> : null}
                </Grid>
                <Grid item xs={12} sm>
                    <kp.PaticipantCardElement data={participant.kp!} />
                    {participant.medical ? <>
                        {participant.medical.details ? <Typography variant="body1" sx={{ mt: 2 }}><b>Medical:</b><br />{participant.medical?.details}</Typography> : null}
                        {event.bigCampMode && participant.medical.accessibility ? <Typography variant="body1" sx={{ mt: 2 }}><b>Accessibility:</b><br />{participant.medical?.accessibility}</Typography> : null}
                        {event.bigCampMode && participant.medical.contactMe ? <Typography variant="body1" sx={{ mt: 2 }}><b>Please contact me about accessibility.</b><br /></Typography> : null}
                    </> : null}
                </Grid>
            </Grid>
        </Paper>
    </Modal>)
}

function saveCSV(event: JsonEventType, user: JsonUserResponseType, participants: JsonParticipantWithExtraType[]) {
    const fields = new ParticipantFields(event)
    const headers = fields.getCSVHeaders(user)
    const values = participants.map(p => fields.getCSVValues(p, user))

    const csvData = stringify([headers, ...values])
    const filename = `${event.name}-Participants-${format(new Date(), 'yyyy-MM-dd')}.csv`
    save(new TextEncoder().encode(csvData), filename)
}