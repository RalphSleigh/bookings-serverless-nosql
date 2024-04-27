import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { JsonEventType, JsonParticipantType, JsonUserResponseType } from "../../lambda-common/onetable.js";
import { managePageContext } from "./managePage.js";
import { Button, Grid, MenuItem, Modal, Paper, Typography } from "@mui/material";
import { ParticipantFields } from "../../shared/participantFields.js";
import { DataGrid, GridCallbackDetails, GridColumnVisibilityModel, GridExportMenuItemProps, GridPrintExportMenuItem, GridRowParams, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExportContainer, GridToolbarFilterButton, MuiEvent } from "@mui/x-data-grid";
import { JsonBookingWithExtraType, JsonParticipantWithExtraType } from "../../shared/computedDataTypes.js";
import { UserContext } from "../user/userContext.js";
import { BookingFields } from "../../shared/bookingFields.js";
import { stringify } from 'csv-stringify/browser/esm/sync';
import save from "save-file";
import format from "date-fns/format";
import { useStickyState } from "../util.js";

export function Component() {
    const { event, bookings, displayDeleted } = useOutletContext<managePageContext>()
    const user = useContext(UserContext)!
    const [selectedBooking, setSelectedBooking] = React.useState<number | undefined>(undefined)

    const fields = new BookingFields(event)

    const columns = fields.getColumnDefs(user)

    const [columnVisibilityModel, setColumnVisibilityModel] =
    useStickyState<GridColumnVisibilityModel>(fields.getDefaultColumnVisibility(), `bookings-columns-${event.id}`);

    const rows = useMemo(() => bookings.filter(b => !b.deleted || displayDeleted).map((b, i) => {
        return { booking: b, id: i }
    }), [bookings])

    const onRowClick = useCallback((params: GridRowParams, event: MuiEvent, details: GridCallbackDetails) => {
        setSelectedBooking(params.row.id)
    }, [bookings])

    return <Grid xs={12} p={2} item>
        <BookingsModal selectedBooking={selectedBooking} booking={typeof selectedBooking == "number" ? bookings[selectedBooking] : undefined} handleClose={() => setSelectedBooking(undefined)} />
        <DataGrid rowSelection={false}
            pageSizeOptions={[100]}
            rows={rows}
            columns={columns}
            onRowClick={onRowClick}
            columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={(newModel) =>
                    setColumnVisibilityModel(newModel)}
            getRowClassName={(params) => `participant-row-deleted-${params.row.booking.deleted}`}
            slots={{ toolbar: CustomToolbar(() => saveCSV(event, user, bookings)) }} />
    </Grid>

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


const BookingsModal = ({ selectedBooking, booking, handleClose }: { selectedBooking: number | undefined, booking: JsonBookingWithExtraType | undefined, handleClose: () => void }) => {
    if (!booking) return null

    const noWrap = { whiteSpace: 'nowrap' as 'nowrap', mt: 1 }
    const participants = booking.participants.map((p, i) => <li key={i}>{p.basic.name}</li>)

    const chunks: JSX.Element[][] = []
    const chunkSize = 20;
    for (let i = 0; i < participants.length; i += chunkSize) {
        chunks.push(participants.slice(i, i + chunkSize))

    }

    return (<Modal
        open={selectedBooking !== undefined}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Paper elevation={6} sx={{ p: 2, outline: 'none' }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm>
                    <Typography id="modal-modal-title" variant="h6">
                        {booking.basic.contactName}
                    </Typography>
                    <Typography variant="body1" sx={noWrap}>
                        <b>Booked By:</b><br /> {booking.basic.contactName}<br />
                        <a href={`mailto:${booking.basic.contactEmail}`}>{booking.basic.contactEmail}</a><br />
                        <a href={`tel:${booking.basic.contactPhone}`}>{booking.basic.contactPhone}</a>
                    </Typography>
                    <Typography variant="body1" sx={noWrap}>
                        <b>Emergency Contact:</b><br /> {booking.emergency?.name}<br />
                        <a href={`tel:${booking.emergency?.phone}`}>{booking.emergency?.phone}</a>
                    </Typography>
                </Grid>
                {chunks.map((c, i) => <Grid item xs={12} sm>
                    {i == 0 ? <Typography key={i} variant="body1" sx={noWrap}><b>Attendees:</b></Typography> : null}
                    <ul>
                        {c}
                    </ul>
                </Grid>)}
            </Grid>
        </Paper>
    </Modal>)
}

function saveCSV(event: JsonEventType, user: JsonUserResponseType, bookings: JsonBookingWithExtraType[]) {
    const fields = new BookingFields(event)
    const headers = fields.getCSVHeaders(user)
    const values = bookings.map(b => fields.getCSVValues(b, user))

    const csvData = stringify([headers, ...values])
    const filename = `${event.name}-Bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`
    save(new TextEncoder().encode(csvData), filename)
}