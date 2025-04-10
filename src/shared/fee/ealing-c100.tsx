import React from "react";
import Markdown from 'react-markdown'
import { Grid, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { FeeLine, FeeStructure } from "./feeStructure.js";
import { AttendanceStructure } from "../attendance/attendanceStructure.js";
import { BookingType, EalingC100FeeEventType, EventType, JsonBookingType, JsonEventType, JsonParticipantType, ParticipantType } from "../../lambda-common/onetable.js";
import { differenceInYears } from "date-fns";
import { Markdown as EmailMarkdown } from "@react-email/markdown";
import { getMemoUpdateFunctions, parseDate } from "../util.js";
import { PartialDeep } from "type-fest";
import { OptionsAttendance } from "../attendance/options.js";


const paymentInstructions = `Please make bank transfers to:  

WOODCRAFT FOLK EALING DISTRICT RC1148195  
50491232  
08-90-80  
  
Please include a sensible reference and drop [ralph.sleigh@woodcraft.org.uk](mailto:ralph.sleigh@woodcraft.org.uk) an email to let us know you have paid.`


export class EalingC100 extends FeeStructure {
    public feeName = "Ealing Camp100"
    public supportedAttendanceStructures = [OptionsAttendance]
    public hasPaymentReference = false

    public ConfigurationElement = ({ attendanceData, data, update }: { attendanceData: JsonEventType["attendanceData"], data: Partial<JsonEventType["feeData"]>, update: any }) => {

        const { updateSubField } = getMemoUpdateFunctions(update)
        const { updateArrayItem } = getMemoUpdateFunctions(updateSubField('options'))

        const OptionsElement = ({ option, i}: {option: string, i: number}) => {
            const { updateField, updateNumber } = getMemoUpdateFunctions(updateArrayItem(i))
            return <>
                <Typography sx={{ mt: 2 }} variant="h5">Ealing fee options = {option}</Typography>
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
                            value={data?.options?.[i]?.ealingUnaccompanied}
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
                            value={data?.options?.[i]?.ealingDiscountUnaccompanied}
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
                            value={data?.options?.[i]?.ealingAccompanied}
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
                            value={data?.options?.[i]?.ealingDiscountAccompanied}
                            onChange={updateNumber('ealingDiscountAccompanied')} />
                    </Grid>
                </Grid>
            </>
        }

        const optionsElements = (attendanceData?.options || []).map((option, i) => <OptionsElement key={i} option={option} i={i} />)

        return <>{optionsElements}</>
    }

    public getFeeLines = (event: JsonEventType | EventType, booking: PartialDeep<JsonBookingType> | BookingType): FeeLine[] => {
        const startDate = parseDate(event.startDate)

        if (!Array.isArray(booking.participants)) return []

        const feeData = event.feeData as EalingC100FeeEventType["feeData"]//@ts-ignore

        const filterParticipants: (any) => any = p => p.basic && p.basic.name && p.basic.dob && p.attendance && typeof p.attendance.option == "number"
        const validateParticipant: (any) => ParticipantType = p => {
            const newP = { ...p, created: p.created ? parseDate(p.created) : new Date() }
            newP.basic.dob = parseDate(newP.basic!.dob)
            return newP
        }

        const validParticipants = (booking.participants as JsonParticipantType[]).filter(filterParticipants).map(validateParticipant)

        if (!validParticipants || validParticipants.length == 0) return []
        const isBookingAccompanied = validParticipants.some(p => differenceInYears(parseDate(event.startDate)!, parseDate(p.basic.dob)!) > 16)
        const lines: FeeLine[] = []
        event.attendanceData?.options?.forEach((option, i) => {
            const participants = validParticipants.filter(p => p.attendance.option === i && differenceInYears(startDate!, p.basic.dob) >= 5)
            if (participants.length > 0) {
                if (isBookingAccompanied) {
                    const description = `${participants.length} ${participants.length == 1 ? "Person" : "People"} (${option}, Accompanied)`
                    lines.push({ description: description, values: [participants.length * feeData.options[i].ealingAccompanied, participants.length * feeData.options[i].ealingDiscountAccompanied] })
                } else {
                    const description = `${participants.length} ${participants.length == 1 ? "Person" : "People"} (${option}, Unaccompanied)`
                    lines.push({ description: description, values: [participants.length * feeData.options[i].ealingUnaccompanied, participants.length * feeData.options[i].ealingDiscountUnaccompanied] })
                }
            }
        })
        return lines
    }

    public DescriptionElement = ({ event, booking }: { event: JsonEventType, booking: PartialDeep<JsonBookingType> }) => {

        const feeData = event.feeData as EalingC100FeeEventType["feeData"]
        const valueHeaders = this.getValueLabels().map((l, i) => <TableCell component="th" key={i}><b>{l}</b></TableCell>)

        const totals: number[] = []

        const myfees = this.getFeeLines(event, booking).map((row, i) => {

            row.values.forEach((v, i) => {
                if (!totals[i]) totals[i] = 0
                totals[i] += v
            })

            return (<TableRow
                key={i}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">{row.description}</TableCell>
                {row.values.map((v, i) => <TableCell key={i}><b>{currency(v)}</b></TableCell>)}
            </TableRow>)
        })

        const adjustments = booking.fees?.filter(f => f.type === "adjustment").map((f, i) => {

            totals.forEach((v, i) => {
                if (!totals[i]) totals[i] = 0
                totals[i] += f.value
            })

            return (<TableRow key={`adjustment-${i}`}>
                <TableCell>{f.description}</TableCell>
                {this.getValueLabels().map((l, i) => <TableCell component="th" key={i}><b>{currency(f.value)}</b></TableCell>)}
            </TableRow>)
        })

        const options = event.attendanceData?.options?.map((option, i) => {
            return <React.Fragment key={i}>
                <TableRow>
                    <TableCell colSpan={3}><b>{option}</b></TableCell>
                </TableRow>
                <TableRow>
                    <TableCell scope="row">Unaccompanied Elfins, Pioneers &amp; Venturers</TableCell>
                    <TableCell>{currency(feeData.options[i].ealingUnaccompanied)}</TableCell>
                    <TableCell>{currency(feeData.options[i].ealingDiscountUnaccompanied)}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell scope="row">Elfins, Pioneers &amp; Venturers accompanied by a responsible adult, DFs and Adults</TableCell>
                    <TableCell>{currency(feeData.options[i].ealingAccompanied)}</TableCell>
                    <TableCell>{currency(feeData.options[i].ealingDiscountAccompanied)}</TableCell>
                </TableRow>
            </React.Fragment>
        })

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
                        {options}
                        <TableRow>
                            <TableCell colSpan={this.getValueLabels().length + 1}><Typography variant="body2" textAlign="center"><b>My Booking</b></Typography></TableCell>
                        </TableRow>
                        {myfees}
                        {adjustments}
                        <TableRow>
                            <TableCell><b>Total</b></TableCell>
                            {totals.map((v, i) => <TableCell key={i}><b>{currency(v)}</b></TableCell>)}
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <this.PaymentElement event={event} />
        </>)
    }

    public PaymentElement = ({ event }: { event: JsonEventType }) => {
        const feeData = event.feeData as EalingC100FeeEventType["feeData"]
        return <Markdown>{paymentInstructions}</Markdown>
    }

    public EmailElement = ({ event, booking }: { event: EventType, booking: BookingType }) => {
        const feeData = event.feeData as EalingC100FeeEventType["feeData"]
        const valueHeaders = this.getValueLabels().map((l, i) => <th key={i}>{l}</th>)
        return (<>
            {paymentInstructions ?
                <EmailMarkdown children={paymentInstructions}
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

    public getPaymentReference(booking: (PartialDeep<JsonBookingType> | BookingType) & { userId: string }) {
        return ""
    }

    public StripeElement = ({ event }: { event: JsonEventType }) => {
        return null
    }
}

const currency = c => c.toLocaleString(undefined, { style: "currency", currency: "GBP" })