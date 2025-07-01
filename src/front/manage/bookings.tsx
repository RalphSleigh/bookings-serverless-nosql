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
import { BookingsModal } from "./bookingsModal.js";

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
        <BookingsModal event={event} selectedBooking={selectedBooking} booking={typeof selectedBooking == "number" ? bookings.filter(b => !b.deleted || displayDeleted)[selectedBooking] : undefined} handleClose={() => setSelectedBooking(undefined)} />
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


function saveCSV(event: JsonEventType, user: JsonUserResponseType, bookings: JsonBookingWithExtraType[]) {
    const fields = new BookingFields(event)
    const headers = fields.getCSVHeaders(user)
    const values = bookings.map(b => fields.getCSVValues(b, user))

    const csvData = stringify([headers, ...values])
    const filename = `${event.name}-Bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`
    save(new TextEncoder().encode(csvData), filename)
}