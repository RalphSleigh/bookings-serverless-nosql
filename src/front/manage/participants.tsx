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
import { parseDate } from "../../shared/util.js";
import { useStickyState } from "../util.js";

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

    return <>
        <Grid xs={12} p={2} item>
            <ParticipantModal selectedParticipant={selectedParticipant} participant={typeof selectedParticipant == "number" ? participants[selectedParticipant] : undefined} handleClose={() => setSelectedParticipant(undefined)} />
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


const ParticipantModal = ({ selectedParticipant, participant, handleClose }: { selectedParticipant: number | undefined, participant: JsonParticipantWithExtraType | undefined, handleClose: () => void }) => {
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
    const capitalizeWord = (word: string) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    };

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
                    <Typography variant="body1" sx={noWrap}>
                        <b>Emergency Contact:</b><br /> {participant.booking.emergency?.name}<br />
                        <a href={`tel:${participant.booking.emergency?.phone}`}>{participant.booking.emergency?.phone}</a>
                    </Typography>
                </Grid>
                <Grid item xs={12} sm>
                    <Typography variant="body1" sx={noWrap}><b>Diet: </b>{capitalizeWord(participant.kp?.diet!)}</Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}><b>Additional&nbsp;Dietary&nbsp;Requirements:</b><br />{participant.kp?.details}</Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}><b>Medical:</b><br />{participant.medical?.details}</Typography>
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