import React from "react";
import Markdown from 'react-markdown'
import { Grid, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { FeeLine, FeeStructure } from "./feeStructure.js";
import { AttendanceStructure } from "../attendance/attendanceStructure.js";
import { Whole } from "../attendance/whole.js";
import { BookingType, EalingFeeEventType, EventType, JsonBookingType, JsonEventType } from "../../lambda-common/onetable.js";
import { differenceInYears } from "date-fns";
import { Markdown as EmailMarkdown } from "@react-email/markdown";
import { getMemoUpdateFunctions, parseDate } from "../util.js";

const paymentInstructions = `Please make bank transfers to:  

WOODCRAFT FOLK EALING DISTRICT RC1148195  
50491232  
08-90-80  
  
Please include a sensible reference and drop [NAME](mailto:email) an email to let me you have paid.`


export class Ealing extends FeeStructure {
    public feeName = "Ealing"
    public supportedAttendanceStructures = [Whole]

    public ConfigurationElement = ({ data, update }: { data: Partial<JsonEventType["feeData"]>, update: any }) => {

        const { updateField, updateNumber } = getMemoUpdateFunctions(update)

        return <>
            <Typography sx={{ mt: 2 }} variant="h5">Ealing fee options</Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
                        sx={{ mt: 2 }}
                        required
                        id="outlined-required"
                        label="Unaccompanied"
                        type="number"
                        value={data.ealingUnaccompanied}
                        onChange={updateNumber('ealingUnaccompanied')} />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
                        sx={{ mt: 2 }}
                        required
                        id="outlined-required"
                        label="Unaccompanied Discount"
                        type="number"
                        value={data.ealingDiscountUnaccompanied}
                        onChange={updateNumber('ealingDiscountUnaccompanied')} />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
                        sx={{ mt: 2 }}
                        required
                        id="outlined-required"
                        label="Accompanied"
                        type="number"
                        value={data.ealingAccompanied}
                        onChange={updateNumber('ealingAccompanied')} />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
                        sx={{ mt: 2 }}
                        required
                        id="outlined-required"
                        label="Accompanied Discount"
                        type="number"
                        value={data.ealingDiscountAccompanied}
                        onChange={updateNumber('ealingDiscountAccompanied')} />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        sx={{ mt: 2 }}
                        required
                        id="outlined-required"
                        label="Payment instructions"
                        defaultValue={paymentInstructions}
                        value={data.paymentInstructions}
                        onChange={updateField('paymentInstructions')} />
                </Grid>
            </Grid>
        </>
    }

    public getFeeLines = (event: JsonEventType | EventType, booking: Partial<JsonBookingType> | BookingType): FeeLine[] => {
        const feeData = event.feeData as EalingFeeEventType["feeData"]//@ts-ignore
        const validParticipants = booking.participants?.filter(p => (p.basic && p.basic.name && p.basic.dob))
        if (!validParticipants || validParticipants.length == 0) return []
        const isBookingAccompanied = validParticipants.some(p => differenceInYears(parseDate(event.startDate)!, parseDate(p.basic.dob)!) > 16)
        if (isBookingAccompanied) {
            const description = `${validParticipants.length} ${validParticipants.length == 1 ? "Person" : "People"} (Accompanied)`
            return [{ description: description, values: [validParticipants.length * feeData.ealingAccompanied, validParticipants.length * feeData.ealingDiscountAccompanied] }]
        } else {
            const description = `${validParticipants.length} ${validParticipants.length == 1 ? "Person" : "People"} (Unaccompanied)`
            return [{ description: description, values: [validParticipants.length * feeData.ealingUnaccompanied, validParticipants.length * feeData.ealingDiscountUnaccompanied] }]
        }
    }

    public DescriptionElement = ({ event, booking }: { event: JsonEventType, booking: Partial<JsonBookingType> }) => {

        const feeData = event.feeData as EalingFeeEventType["feeData"]
        const valueHeaders = this.getValueLabels().map((l, i) => <TableCell component="th" key={i}><b>{l}</b></TableCell>)

        return (<>
            <Typography variant="body2" mt={2}>The discounted donation is offered to all
                families/individuals where there is no wage earner and/or the family/individual is on a low wage. This
                would include DFs and students as well as adults and families. Cost should never be a reason for people
                being unable to attend camp so please contact us if you need further discount.</Typography>
            <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell></TableCell>
                            {valueHeaders}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell scope="row">Unaccompanied Elfins, Pioneers &amp; Venturers</TableCell>
                            <TableCell>{currency(feeData.ealingUnaccompanied)}</TableCell>
                            <TableCell>{currency(feeData.ealingDiscountUnaccompanied)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell scope="row">Elfins, Pioneers &amp; Venturers accompanied by a responsible adult, DFs and Adults</TableCell>
                            <TableCell>{currency(feeData.ealingAccompanied)}</TableCell>
                            <TableCell>{currency(feeData.ealingDiscountAccompanied)}</TableCell>
                        </TableRow>
                        {this.getFeeLines(event, booking).map((row, i) => (
                            <TableRow
                                key={i}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row"><b>My Booking: {row.description}</b></TableCell>
                                {row.values.map((v, i) => <TableCell key={i}><b>{currency(v)}</b></TableCell>)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <this.PaymentElement event={event} />
        </>)
    }

    public PaymentElement = ({ event }: { event: JsonEventType }) => {
        const feeData = event.feeData as EalingFeeEventType["feeData"]
        return <Markdown>{feeData.paymentInstructions}</Markdown>
    }

    public EmailElement = ({ event, booking }: { event: EventType, booking: BookingType }) => {
        const feeData = event.feeData as EalingFeeEventType["feeData"]
        const valueHeaders = this.getValueLabels().map((l, i) => <th key={i}>{l}</th>)
        return (<>
            {feeData.paymentInstructions ?
                <EmailMarkdown children={feeData.paymentInstructions}
                    markdownCustomStyles={{
                        p: { fontSize: "14px" },
                    }}
                /> : null}
            <table>
                <thead>
                    <tr>
                        <th></th>
                        {valueHeaders}
                    </tr>
                </thead>
                <tbody>
                    {this.getFeeLines(event, booking).map((row, i) => (
                        <tr key={i}>
                            <td>My Booking: {row.description}</td>
                            {row.values.map((v, i) => <td key={i}>{currency(v)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>)
    }

    public getValueLabels = () => (["Standard", "Discounted"])
}

const currency = c => c.toLocaleString(undefined, { style: "currency", currency: "GBP" })