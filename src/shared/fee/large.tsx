import React from "react";
import Markdown from 'react-markdown'
import { Grid, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { FeeLine, FeeStructure } from "./feeStructure.js";
import { BookingType, EalingFeeEventType, EventType, JsonBookingType, JsonEventType, JsonParticipantType, LargeFeeEventType, ParticipantType } from "../../lambda-common/onetable.js";
import { differenceInYears, format } from "date-fns";
import { Markdown as EmailMarkdown } from "@react-email/markdown";
import { getMemoUpdateFunctions, parseDate } from "../util.js";
import { PartialDeep } from "type-fest";
import { OptionsAttendance } from "../attendance/options.js";
import { DateTimePicker } from '@mui/x-date-pickers'
import { JsonBookingWithExtraType } from "../computedDataTypes.js";
import { organisations } from "../ifm.js";

const paymentInstructions = `Please make bank transfers to:  

WOODCRAFT FOLK EALING DISTRICT RC1148195  
50491232  
08-90-80  
  
Please include a sensible reference and drop [NAME](mailto:email) an email to let me you have paid.`

export class Large extends FeeStructure {
    public feeName = "Large Camp Style"
    public hasPaymentReference = true
    public supportedAttendanceStructures = [OptionsAttendance]

    public ConfigurationElement = ({ attendanceData, data, update }: { attendanceData: JsonEventType["attendanceData"], data: Partial<JsonEventType["feeData"]>, update: any }) => {

        const { updateSubField } = getMemoUpdateFunctions(update)
        const { updateArrayItem } = getMemoUpdateFunctions(updateSubField('largeCampBands'))
        const { updateField } = getMemoUpdateFunctions(updateSubField('regionalPrices'))


        const bands = [...(data.largeCampBands || []), {}].map((band, i) => {
            return <FeeBandConfig key={i} attendanceData={attendanceData} data={band} update={updateArrayItem(i)} />
        })

        const regionItems = organisations.reduce((acc, org) => {
            if(!(acc.includes(org[1])))acc.push(org[1])
            return acc
        },[]).map((r, i) => <TextField
            InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
            key={i}
            fullWidth
            id="outlined-required"
            label={r}
            type="number" //@ts-ignore
            value={data.regionalPrices?.[r] || ""} 
            onChange={updateField(r)} />)

        return <>
            <Typography sx={{ mt: 2 }} variant="h5">Large Camp Fee Options</Typography>
            <Typography variant="body2" mt={2}>Under 5s are free, everyone else will be charged the band that's before date is in the future and closest to the time they book, please ensure there is a band that covers the event period in to cover people added during the event. The before datetime should be supplied in UTC.</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    {bands}
                </Grid>
                <Grid item xs={12}>
                    {regionItems}
                </Grid>
            </Grid>
        </>
    }


    public getFeeLines = (event: JsonEventType | EventType, booking: PartialDeep<JsonBookingType> | BookingType | JsonBookingWithExtraType): FeeLine[] => {
        const feeData = event.feeData as LargeFeeEventType["feeData"]//@ts-ignore
        const startDate = parseDate(event.startDate)
        if (Array.isArray(booking.participants)) {

            const filterParticipants: (any) => any = p => p.basic && p.basic.name && p.basic.dob && p.attendance && typeof p.attendance.option == "number"
            const validateParticipant: (any) => ParticipantType = p => {
                p.created = p.created ? parseDate(p.created) : new Date()
                p.basic.dob = parseDate(p.basic!.dob)
                return p
            }

            const computedBands = feeData.largeCampBands.map(band => {
                return { ...band, beforeDate: parseDate(band.before), beforeString: parseDate(band.before)!.toISOString() }
            })

            let free = 0
            let totals: Record<string, Record<number, { count: number, band: typeof computedBands[0] }>> = {}

            const validParticipants = (booking.participants as JsonParticipantType[]).filter(filterParticipants).map(validateParticipant)

            for (const participant of validParticipants) {
                if (differenceInYears(startDate!, participant.basic.dob) < 5) {
                    free++
                } else {
                    for (const band of computedBands) {
                        if (band.beforeDate! > participant.created) {
                            if (!totals[band.beforeString]) totals[band.beforeString] = {}
                            if (!totals[band.beforeString][participant.attendance!.option!]) totals[band.beforeString][participant.attendance!.option!] = { count: 0, band: band }
                            totals[band.beforeString][participant.attendance!.option!].count++
                            break
                        }
                    }
                }
            }

            const results: FeeLine[] = []

            const region = organisations.find(o => o[0] === booking.basic?.organisation)?.[1]
            if(region && feeData.regionalPrices && feeData.regionalPrices[region]){
                const price = feeData.regionalPrices[region]
                const paying = validParticipants.length - free
                if (free > 0) results.push({ description: `${free} Under 5s for free`, values: [0] })
                if (paying > 0) results.push({ description: `${paying} ${paying == 1 ? 'Person' : 'People'} for the ${region} price`, values: [paying * price] })
                return results
            }
 
            if (free > 0) results.push({ description: `${free} Under 5s for free`, values: [0] })
            for (const [band, item] of Object.entries(totals)) {
                for (const [index, option] of Object.entries(item)) {
                    results.push({
                        description: `${option.count} ${option.count == 1 ? 'Person' : 'People'} for the ${event.attendanceData!.options![index]} before ${option.band.description}`,
                        tooltip: `${format(option.band.beforeDate!, 'PPPp')}`,
                        values: [option.count * option.band.fees[index]]
                    })
                }
            }
            return results
        } else {
            return []
        }
    }

    public DescriptionElement = ({ event, booking }: { event: JsonEventType, booking: PartialDeep<JsonBookingType>}) => {

        const feeData = event.feeData as EalingFeeEventType["feeData"]
        const valueHeaders = this.getValueLabels().map((l, i) => <TableCell component="th" key={i}><b>{l}</b></TableCell>)

        const totals: number[] = []

        let paymentTotal = 0

        const payments = booking.fees?.filter(f => f.type === "payment").map((f, i) => {
            paymentTotal += f.value
            return (<TableRow key={`payment-${i}`}>
                <TableCell>{f.description}</TableCell>
                {this.getValueLabels().map((l, i) => <TableCell component="th" key={i}></TableCell>)}
                <TableCell component="th" key={i}>{currency(f.value)}</TableCell>
            </TableRow>)
        })

        const myfees = this.getFeeLines(event, booking).map((row, i) => {

            row.values.forEach((v, i) => {
                if (!totals[i]) totals[i] = 0
                totals[i] += v
            })

            return (<TableRow
                key={i}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row"><Tooltip followCursor={true} title={row.tooltip}><span>{row.description}</span></Tooltip></TableCell>
                {row.values.map((v, i) => <TableCell key={i}>{currency(v)}</TableCell>)}
                {payments && payments.length > 0 ? <TableCell></TableCell> : null}
            </TableRow>)
        })

        const adjustments = booking.fees?.filter(f => f.type === "adjustment").map((f, i) => {
            totals.forEach((v, i) => {
                if (!totals[i]) totals[i] = 0
                totals[i] += f.value
            })

            return (<TableRow key={`adjustment-${i}`}>
                <TableCell>{f.description}</TableCell>
                {this.getValueLabels().map((l, i) => <TableCell component="th" key={i}>{currency(f.value)}</TableCell>)}
                {payments && payments.length > 0 ? <TableCell></TableCell> : null}
            </TableRow>)
        })

        return (<>
            <Typography variant="body2" mt={2}>PLACEHOLDER: SOME TEXT ABOUT THE FEES SHOULD GO HERE? IDK BTW YOUR PAYMENT REFERENCE IS {this.getPaymentReference(booking as PartialDeep<JsonBookingType> & { userId: string })}</Typography>
            <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell></TableCell>
                            {valueHeaders}
                            {payments && payments.length > 0 ? <TableCell><b>Payments</b></TableCell> : null}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {myfees}
                        {adjustments}
                        {payments}
                        <TableRow>
                            <TableCell><b>Total</b></TableCell>
                            {totals.map((v, i) => <TableCell key={i}><b>{currency(v)}</b></TableCell>)}
                            {payments && payments.length > 0 ? <TableCell><b>{currency(paymentTotal)}</b></TableCell> : null}
                        </TableRow>
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

    public getValueLabels = () => (["Fee"])

    public getPaymentReference(booking: PartialDeep<JsonBookingType> & { userId: string }){
        return `C100-${booking.userId.toUpperCase().substring(0,5)}`
    }
}

const currency = c => c.toLocaleString(undefined, { style: "currency", currency: "GBP" })

const FeeBandConfig = ({ attendanceData, data, update }: { attendanceData: JsonEventType["attendanceData"], data: PartialDeep<Required<JsonEventType["feeData"]>["largeCampBands"][0]>, update: any }) => {

    const { updateDate, updateNumber, updateSubField, updateField } = getMemoUpdateFunctions(update)
    const { setArrayItem } = getMemoUpdateFunctions(updateSubField('fees'))

    const feeFields = (attendanceData?.options || []).map((option, i) => {
        return <TextField
            InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
            key={i}
            sx={{ ml: 2, width: 200 }}
            id="outlined-required"
            label={option}
            type="number"
            value={data?.fees?.[i]}
            onChange={setArrayItem(i)} />
    })

    return <Paper sx={{ p: 2, mt: 2 }}>
        <DateTimePicker label="Before" value={parseDate(data.before)} onChange={updateDate('before')} timezone="UTC" />
        <TextField
            sx={{ ml: 2, width: 200 }}
            id="outlined-required"
            label={"description"}
            value={data?.description}
            onChange={updateField('description')} />
        {feeFields}
    </Paper>
}