import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { JsonEventType, JsonUserType, JsonUserResponseType } from "../../lambda-common/onetable.js";
import { managePageContext } from "./managePage.js";
import { Box, Button, Grid, Tooltip, Modal, Paper, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Table, TextField, InputAdornment, IconButton } from "@mui/material";
import { ParticipantFields } from "../../shared/participantFields.js";
import { DataGrid, GridCallbackDetails, GridRowParams, MuiEvent } from "@mui/x-data-grid";
import { JsonBookingWithExtraType, JsonParticipantWithExtraType } from "../../shared/computedDataTypes.js";
import { UserContext } from "../user/userContext.js";
import { format, parseISO } from "date-fns";
import { stringify } from 'csv-stringify/browser/esm/sync';
import save from 'save-file'
import { getMemoUpdateFunctions, parseDate } from "../../shared/util.js";
import { getFee } from "../../shared/fee/fee.js";
import { useBookingOperation, useAllUsersQuery } from "../queries.js";
import { Close } from "@mui/icons-material";

export function Component() {
    const { event, bookings: rawBookings, displayDeleted } = useOutletContext<managePageContext>()
    const bookings = rawBookings.filter(b => !b.deleted)
    const allUsers = useAllUsersQuery(event.id).data.users
    const user = useContext(UserContext)!
    const [selectedBooking, setSelectedBooking] = React.useState<number | undefined>(undefined)

    const onRowClick = useCallback((i: number) => {
        setSelectedBooking(i)
    }, [bookings])

    const modal = typeof selectedBooking == "number" && bookings[selectedBooking] ? <MoneyModal selectedBooking={selectedBooking} event={event} booking={bookings[selectedBooking]} users={allUsers} handleClose={() => setSelectedBooking(undefined)} /> : null

    return (<Grid xs={12} p={2} item>
        {modal}
        <MemoMoneyTable event={event} bookings={bookings} onRowClick={onRowClick} />
    </Grid>)
}

const MoneyTable = ({ event, bookings, onRowClick }: { event: JsonEventType, bookings: JsonBookingWithExtraType[], onRowClick: any }) => {
    const totals: number[] = []
    const fees = getFee(event)
    let totalPaid = 0
    const rows = bookings.filter(b => !b.deleted).map((b, i) => {
        const row = fees.getFeeLines(event, b).reduce<number[]>((a, c) => {
            c.values.forEach((v, i) => {
                if (a[i] === undefined) a[i] = 0
                a[i] += v
                if (totals[i] === undefined) totals[i] = 0
                totals[i] += v
            })
            return a
        }, fees.getValueLabels().map(() => 0))

        b.fees.filter(f => f.type === "adjustment").forEach(f => {
            row.forEach((v, i) => row[i] += f.value)
            totals.forEach((v, i) => totals[i] += f.value)
        })

        const paid = b.fees.filter(f => f.type === "payment").reduce((a, c) => a + c.value, 0)
        totalPaid += paid
        const paidUp = row.filter(r => paid >= r).length > 0

        const contactName = b.participants.length == 1 ? b.participants[0].basic.name : event.bigCampMode ? b.basic.district ? b.basic.district : b.basic.contactName : b.basic.contactName

        return <TableRow key={i} onClick={() => onRowClick(i)} hover>
            {fees.hasPaymentReference ? <TableCell>{fees.getPaymentReference(b)}</TableCell> : null}
            <TableCell>{contactName}</TableCell>
            {row.map((v, i) => <TableCell key={i}>{currency(v)}</TableCell>)}
            <TableCell>{currency(paid)}</TableCell>
            <TableCell>{currency(row[0] - paid)} {paidUp ? '✅' : ''}</TableCell>
        </TableRow>
    })

    const valueHeaders = fees.getValueLabels().map((v, i) => <TableCell key={i}><strong>{v}</strong></TableCell>)
    const totalsRow = totals.map((v, i) => <TableCell key={i}><strong>{currency(v)}</strong></TableCell>)

    return <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
        <Table size="small">
            <TableHead>
                <TableRow>
                    {fees.hasPaymentReference ? <TableCell><strong>Reference</strong></TableCell> : null}
                    <TableCell><strong>Booking</strong></TableCell>
                    {valueHeaders}
                    <TableCell><strong>Paid</strong></TableCell>
                    <TableCell><strong>Outstanding</strong></TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {rows}
                <TableRow>
                    <TableCell><strong>Totals</strong></TableCell>
                    {fees.hasPaymentReference ? <TableCell></TableCell> : null}
                    {totalsRow}
                    <TableCell><strong>{currency(totalPaid)}</strong></TableCell>
                    <TableCell><strong>{currency(totals[0] - totalPaid)}</strong></TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </TableContainer>
}

const MemoMoneyTable = React.memo(MoneyTable)

const MoneyModal = ({ selectedBooking, booking, event, users, handleClose }: { selectedBooking: number, booking: JsonBookingWithExtraType, event: JsonEventType, users: JsonUserType[], handleClose: () => void }) => {
    const feeMutation = useBookingOperation()

    const removeFeeItem = date => e => {
        feeMutation.mutate({
            eventId: event.id, userId: booking.userId, operation: {
                type: "removeFeeItem",
                date
            }
        })
        e.preventDefault()
    }

    const fees = getFee(event)
    const feeRows = fees.getFeeLines(event, booking).map((row, i) => {
        return <TableRow
            key={i}>
            <TableCell component="th" scope="row"><Typography variant="body2">{row.description}</Typography></TableCell>
            {row.values.map((v, i) => <TableCell key={i}>{currency(v)}</TableCell>)}
            <TableCell></TableCell>
            <TableCell>
                <IconButton disabled={true} color="warning" size="small">
                    <Close />
                </IconButton>
            </TableCell>
        </TableRow>
    })
    let totals = fees.getFeeLines(event, booking).reduce<number[]>((a, c) => {
        c.values.forEach((v, i) => {
            if (a[i] === undefined) a[i] = 0
            a[i] += v
        })
        return a
    }, fees.getValueLabels().map(() => 0))

    const adjustmentRows = booking.fees.filter(f => f.type === "adjustment").map((f, i) => {
        totals = totals.map((v, i) => totals[i] += f.value)
        const user = users.find(u => u.id === f.userId)
        return <TableRow key={`adjustment-${i}`}>
            <TableCell><Tooltip title={`Added by ${user?.userName} on ${format(parseISO(f.date), "do LLLL")}`}><Typography variant="body2">{f.description}</Typography></Tooltip></TableCell>
            {fees.getValueLabels().map((v, i) => <TableCell key={i}>{currency(f.value)}</TableCell>)}
            <TableCell></TableCell>
            <TableCell>
                <IconButton onClick={removeFeeItem(f.date)} color="warning" size="small" disabled={feeMutation.isPending}>
                    <Close />
                </IconButton>
            </TableCell>
        </TableRow>
    })

    let paymentTotal = 0

    const paymentRows = booking.fees.filter(f => f.type === "payment").map((f, i) => {
        paymentTotal += f.value
        const user = users.find(u => u.id === f.userId)
        return <TableRow key={`payment-${i}`}>
            <TableCell><Tooltip title={`Added by ${user?.userName} on ${format(parseISO(f.date), "do LLLL")}`}><Typography variant="body2">{f.description}</Typography></Tooltip></TableCell>
            {fees.getValueLabels().map((v, i) => <TableCell key={i}></TableCell>)}
            <TableCell>{currency(f.value)}</TableCell>
            <TableCell>
                <IconButton onClick={removeFeeItem(f.date)} color="warning" size="small" disabled={feeMutation.isPending}>
                    <Close />
                </IconButton>
            </TableCell>
        </TableRow>
    })

    const totalsRow = totals.map((v, i) => <TableCell key={i}><strong>{currency(v)}</strong></TableCell>)

    const [feeItem, setFeeItem] = React.useState<{ value: string, description: string }>({ value: (totals[0] - paymentTotal).toString(), description: "Paid in full" })
    const { updateField, updateNumber } = getMemoUpdateFunctions(setFeeItem)
    const numberValid = !Number.isNaN(parseFloat(feeItem.value))

    const submitPayment = e => {
        if (!numberValid) return
        feeMutation.mutate({
            eventId: event.id, userId: booking.userId, operation: {
                type: "addPayment",
                value: parseFloat(feeItem.value),
                description: feeItem.description
            }
        })
        e.preventDefault()
    }

    const submitAdjustment = e => {
        if (!numberValid) return
        feeMutation.mutate({
            eventId: event.id, userId: booking.userId, operation: {
                type: "addAdjustment",
                value: parseFloat(feeItem.value),
                description: feeItem.description
            }
        })
        e.preventDefault()
    }




    const valueHeaders = fees.getValueLabels().map((v, i) => <TableCell key={i}><strong>{v}</strong></TableCell>)

    return (<Modal
        open={selectedBooking !== undefined}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Paper elevation={6} sx={{ p: 2, outline: 'none' }}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography id="modal-modal-title" variant="h6">
                        {event.bigCampMode ? booking.basic.district : booking.basic.contactName}
                    </Typography>
                    <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Item</strong></TableCell>
                                    {valueHeaders}
                                    <TableCell><strong>Payments</strong></TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {feeRows}
                                {adjustmentRows}
                                {paymentRows}
                                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell><strong>Totals</strong></TableCell>
                                    {totalsRow}
                                    <TableCell><strong>{currency(paymentTotal)}</strong></TableCell>
                                    <TableCell><strong>{currency(totals[0] - paymentTotal)}</strong></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                    <TextField autoComplete="off" fullWidth sx={{ mt: 2 }} error={!numberValid} required id="outlined-required" label="Value" type="text" inputProps={{ inputMode: "numeric" }} InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }} value={feeItem.value} onChange={updateField('value')} />
                </Grid>
                <Grid item xs={12} sm={9}>
                    <TextField autoComplete="off" fullWidth sx={{ mt: 2 }} required id="outlined-required" label="Description" type="text" value={feeItem.description} onChange={updateField('description')} />
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" color="success" disabled={!numberValid || feeMutation.isPending || feeItem.description == ""} onClick={submitPayment}>Add Payment</Button>
                    <Button variant="contained" sx={{ ml: 2 }} disabled={!numberValid || feeMutation.isPending || feeItem.description == ""} onClick={submitAdjustment}>Add Adjustment</Button>
                </Grid>
            </Grid>
        </Paper>
    </Modal >)
}

function saveCSV(event: JsonEventType, user: JsonUserResponseType, participants: JsonParticipantWithExtraType[]) {
    const fields = new ParticipantFields(event)
    const headers = fields.getCSVHeaders(user)
    const values = participants.map(p => fields.getCSVValues(p, user))

    const csvData = stringify([headers, ...values])
    const filename = `${event.name}-Participants-${format(new Date(), 'yyyy-MM-dd')}.csv`
    save(new TextEncoder().encode(csvData), filename)
}



const currency = c => c.toLocaleString(undefined, { style: "currency", currency: "GBP" })