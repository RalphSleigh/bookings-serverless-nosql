import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { JsonEventType, JsonParticipantType, JsonUserResponseType } from "../../lambda-common/onetable.js";
import { managePageContext } from "./managePage.js";
import { Avatar, AvatarGroup, Box, Button, Grid, MenuItem, Modal, Paper, Stack, Typography } from "@mui/material";
import { ParticipantFields } from "../../shared/participantFields.js";
import { DataGrid, GridCallbackDetails, GridColumnVisibilityModel, GridExportMenuItemProps, GridPrintExportMenuItem, GridRowParams, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExportContainer, GridToolbarFilterButton, MuiEvent } from "@mui/x-data-grid";
import { JsonBookingWithExtraType, JsonParticipantWithExtraType } from "../../shared/computedDataTypes.js";
import { UserContext } from "../user/userContext.js";
import { BookingFields } from "../../shared/bookingFields.js";
import { stringify } from 'csv-stringify/browser/esm/sync';
import save from "save-file";
import format from "date-fns/format";
import { useStickyState } from "../util.js";
import { applicationTypeIcon } from "./utils.js";
import { fees } from "../../shared/fee/fee.js";
import { IfHasPermission } from "../permissions.js";
import { CanCreateAnyRole } from "../../shared/permissions.js";
import { useCreateRole, useEventRoles } from "../queries.js";
import { parseDate } from "../../shared/util.js";

export function Component() {
    const { event, bookings, displayDeleted } = useOutletContext<managePageContext>()
    const user = useContext(UserContext)!
    const [selectedBooking, setSelectedBooking] = React.useState<number | undefined>(undefined)

    const fields = new BookingFields(event)

    const columns = fields.getColumnDefs(user)

    const [columnVisibilityModel, setColumnVisibilityModel] =
        useStickyState<GridColumnVisibilityModel>(fields.getDefaultColumnVisibility(), `bookings-columns-${event.id}`);

    const [columnSortModel, setColumncolumnSortModelModel] =
        useStickyState<any>([
            {
              field: 'Updated',
              sort: 'asc',
            },
          ], `bookings-columns-sort-${event.id}`);

    const rows = useMemo(() => bookings.filter(b => !b.deleted || displayDeleted).map((b, i) => {
        return { booking: b, id: i }
    }), [bookings])

    const onRowClick = useCallback((params: GridRowParams, event: MuiEvent, details: GridCallbackDetails) => {
        setSelectedBooking(params.row.id)
    }, [bookings])

    return <Grid xs={12} p={2} item>
        <BookingsModal event={event} selectedBooking={selectedBooking} booking={typeof selectedBooking == "number" ? bookings[selectedBooking] : undefined} handleClose={() => setSelectedBooking(undefined)} />
        <DataGrid rowSelection={false}
            pageSizeOptions={[100]}
            rows={rows}
            columns={columns}
            onRowClick={onRowClick}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) =>
                setColumnVisibilityModel(newModel)}
            sortModel={columnSortModel}
            onSortModelChange={(newModel) =>
                setColumncolumnSortModelModel(newModel)}
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


const BookingsModal = ({ event, selectedBooking, booking, handleClose }: { event: JsonEventType, selectedBooking: number | undefined, booking: JsonBookingWithExtraType | undefined, handleClose: () => void }) => {
    if (!booking) return null

    const noWrap = { whiteSpace: 'nowrap' as 'nowrap', mt: 1 }
    const participants = booking.participants.map((p, i) => <li key={i}>{p.basic.name}</li>)

    const chunks: JSX.Element[][] = []
    const chunkSize = 20;
    for (let i = 0; i < participants.length; i += chunkSize) {
        chunks.push(participants.slice(i, i + chunkSize))

    }

    const customAnswers = event.customQuestions.map((q, i) => <Typography key={i} variant="body1" sx={noWrap}>
        <b>{q.questionLabel}</b><br /> {booking.customQuestions?.[i]?.toString()}
    </Typography>)

    const pastDeadline = parseDate(event.bookingDeadline)!.getTime() < new Date().getTime()

    return (<Modal
        open={selectedBooking !== undefined}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Paper elevation={6} sx={{ p: 2, outline: 'none', maxWidth: "95vw" }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm>
                    <Stack alignItems="center" gap={1} direction="row"><Typography id="modal-modal-title" variant="h6">
                        {booking.basic.contactName}
                    </Typography>
                        {applicationTypeIcon(booking.basic.bookingType)}
                    </Stack>
                    <Typography id="modal-modal-title" variant="subtitle1">
                        {booking.basic.organisation}
                    </Typography>
                    {booking.basic.district ? <Typography id="modal-modal-title" variant="subtitle1">
                        {booking.basic.district}
                    </Typography> : null}
                    <Typography variant="body1" sx={noWrap}>
                        <b>Booked By:</b><br /> {booking.basic.contactName}<br />
                        <a href={`mailto:${booking.basic.contactEmail}`}>{booking.basic.contactEmail}</a><br />
                        <a href={`tel:${booking.basic.contactPhone}`}>{booking.basic.contactPhone}</a>
                    </Typography>
                    {booking.emergency?.name || booking.emergency?.phone ? <Typography variant="body1" sx={noWrap}>
                        <b>Emergency Contact:</b><br /> {booking.emergency?.name}<br />
                        <a href={`tel:${booking.emergency?.phone}`}>{booking.emergency?.phone}</a>
                    </Typography> : null}
                    {event.bigCampMode ? <>
                        <Typography variant="body1" sx={noWrap}>
                            <b>Camp with:</b><br /> {booking.camping?.campWith}
                        </Typography>
                        <Typography variant="body1">
                            <b>Camping Equipment:</b><br /> {booking.camping?.canBringEquipment}
                        </Typography>
                        <Typography variant="body1">
                            <b>Camping Accessibility:</b><br /> {booking.camping?.accessibilityNeeds}
                        </Typography>
                        <Typography variant="body1" sx={noWrap}>
                            <b>How heard:</b><br /> {booking.basic.howDidYouHear}
                        </Typography>
                        <Typography variant="body1" sx={noWrap}>
                            <b>Payment Reference:</b><br /> {fees.large.getPaymentReference(booking)}
                        </Typography>
                    </> : null}
                    {customAnswers}
                </Grid>
                {chunks.map((c, i) => <Grid item xs={12} sm key={i}>
                    {i == 0 ? <Typography variant="body1" sx={noWrap}><b>Attendees: ({booking.participants.length})</b></Typography> : null}
                    <ul>
                        {c}
                    </ul>
                </Grid>)}
                {pastDeadline && event.bigCampMode ? <IfHasPermission permission={CanCreateAnyRole} event={event}>
                    <UnlockWidget event={event} booking={booking} />
                </IfHasPermission> : null}
            </Grid>
        </Paper>
    </Modal>)
}

const UnlockWidget = ({ event, booking }: { event: JsonEventType, booking: JsonBookingWithExtraType }) => {
    const createRole = useCreateRole(event.id)
    const roleData = useEventRoles(event.id)

    const haveRole = roleData.data?.roles.find(r => r.userId === booking.userId && r.role === "Amend")

    const unlockOnClick = () => {
        createRole.mutate({ eventId: event.id, userId: booking.userId, role: "Amend" })
    }

    return <Grid item xs={12}>
        {haveRole ? <Button variant="contained" disabled={true} >Unlocked</Button> : <Button variant="contained" disabled={createRole.isPending} onClick={unlockOnClick}>Unlock</Button>}
    </Grid>
}

function saveCSV(event: JsonEventType, user: JsonUserResponseType, bookings: JsonBookingWithExtraType[]) {
    const fields = new BookingFields(event)
    const headers = fields.getCSVHeaders(user)
    const values = bookings.map(b => fields.getCSVValues(b, user))

    const csvData = stringify([headers, ...values])
    const filename = `${event.name}-Bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`
    save(new TextEncoder().encode(csvData), filename)
}