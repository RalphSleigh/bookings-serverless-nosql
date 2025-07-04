import React, { useContext } from "react";
import Markdown from "react-markdown";
import {
  Box,
  Button,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { FeeLine, FeeStructure } from "./feeStructure.js";
import { BookingType, EalingFeeEventType, EventType, JsonBookingType, JsonEventType, JsonParticipantType, LargeFeeEventType, ParticipantType } from "../../lambda-common/onetable.js";
import { differenceInYears, format } from "date-fns";
import { Markdown as EmailMarkdown } from "@react-email/markdown";
import { getMemoUpdateFunctions, parseDate } from "../util.js";
import { PartialDeep } from "type-fest";
import { OptionsAttendance } from "../attendance/options.js";
import { DateTimePicker } from "@mui/x-date-pickers";
import { JsonBookingWithExtraType } from "../computedDataTypes.js";
import { organisations } from "../ifm.js";
import { EnvContext } from "../../front/app/envContext.js";
import { Description } from "@mui/icons-material";
import addDays from "date-fns/addDays";

const paymentInstructions = `Please make bank transfers to:  

WOODCRAFT FOLK EALING DISTRICT RC1148195  
50491232  
08-90-80  
  
Please include a sensible reference and drop [NAME](mailto:email) an email to let me you have paid.`;

export class Large extends FeeStructure {
  public feeName = "Large Camp Style";
  public hasPaymentReference = true;
  public supportedAttendanceStructures = [OptionsAttendance];

  public ConfigurationElement = ({ attendanceData, data, update }: { attendanceData: JsonEventType["attendanceData"]; data: Partial<JsonEventType["feeData"]>; update: any }) => {
    const { updateSubField } = getMemoUpdateFunctions(update);
    const { updateArrayItem } = getMemoUpdateFunctions(updateSubField("largeCampBands"));
    const { updateField } = getMemoUpdateFunctions(updateSubField("regionalPrices"));

    const bands = [...(data.largeCampBands || []), {}].map((band, i) => {
      return <FeeBandConfig key={i} attendanceData={attendanceData} data={band} update={updateArrayItem(i)} />;
    });

    const regionItems = organisations
      .reduce((acc, org) => {
        if (!acc.includes(org[1])) acc.push(org[1]);
        return acc;
      }, [])
      .map((r, i) => (
        <TextField
          InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
          key={i}
          fullWidth
          id="outlined-required"
          label={r}
          type="number" //@ts-ignore
          value={data.regionalPrices?.[r] || ""}
          onChange={updateField(r)}
        />
      ));

    return (
      <>
        <Typography sx={{ mt: 2 }} variant="h5">
          Large Camp Fee Options
        </Typography>
        <Typography variant="body2" mt={2}>
          Under 5s are free, everyone else will be charged the band that's before date is in the future and closest to the time they book, please ensure there is a band that covers the event period in
          to cover people added during the event. The before datetime should be supplied in UTC.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {bands}
          </Grid>
          <Grid item xs={12}>
            {regionItems}
          </Grid>
        </Grid>
      </>
    );
  };

  public getFeeLines = (event: JsonEventType | EventType, booking: PartialDeep<JsonBookingType> | BookingType | JsonBookingWithExtraType): FeeLine[] => {
    const feeData = event.feeData as LargeFeeEventType["feeData"]; //@ts-ignore
    const startDate = parseDate(event.startDate);
    if (Array.isArray(booking.participants)) {
      const filterParticipants: (any) => any = (p) => p.basic && p.basic.name && p.basic.dob && p.attendance && typeof p.attendance.option == "number";
      const validateParticipant: (any) => ParticipantType = (p) => {
        const newP = { ...p, created: p.created ? parseDate(p.created) : new Date() };
        newP.basic.dob = parseDate(newP.basic!.dob);
        return newP;
      };

      const validatePreviousParticipant: (any) => ParticipantType = (p) => {
        const newP = { ...p, created: p.created ? parseDate(p.created) : addDays(parseDate(event.bookingDeadline!), -1) };
        newP.basic.dob = parseDate(newP.basic!.dob);
        return newP;
      };

      const computedBands = feeData.largeCampBands.map((band) => {
        return { ...band, beforeDate: parseDate(band.before), beforeString: parseDate(band.before)!.toISOString() };
      });

      let free = 0;
      let totals: Record<string, Record<number, { count: number; band: (typeof computedBands)[0]; tooltip: string }>> = {};

      const validParticipants = (booking.participants as JsonParticipantType[])
        .filter(filterParticipants)
        .map(validateParticipant)
        .sort((a, b) => a.created.getTime() - b.created.getTime());
      const validPrevParticipants = (booking.extraFeeData?.participantsAtDeadline || []).filter(filterParticipants).map(validatePreviousParticipant);

      let participantCount = 0;
      const bookingCreatedBeforeDeadline = booking.created ? parseDate(event.bookingDeadline!)!.getTime() > parseDate(booking.created!)!.getTime() : false

      for (const participant of validParticipants) {
        if (participantCount < validPrevParticipants.length && bookingCreatedBeforeDeadline) {
          participantCount++;
          if (differenceInYears(startDate!, participant.basic.dob) < 5) {
            free++;
          } else {
            const band = computedBands[0];
            if (!totals[band.beforeString]) totals[band.beforeString] = {};
            if (!totals[band.beforeString][participant.attendance!.option!]) totals[band.beforeString][participant.attendance!.option!] = { count: 0, band: band, tooltip: "" };
            totals[band.beforeString][participant.attendance!.option!].count++;
            totals[band.beforeString][participant.attendance!.option!].tooltip += `${participant.basic.name}, \n`
          }
        } else {
          if (differenceInYears(startDate!, participant.basic.dob) < 5) {
            free++;
          } else {
            for (const band of computedBands) {
              if (band.beforeDate! > participant.created) {
                if (!totals[band.beforeString]) totals[band.beforeString] = {};
                if (!totals[band.beforeString][participant.attendance!.option!]) totals[band.beforeString][participant.attendance!.option!] = { count: 0, band: band, tooltip: "" };
                totals[band.beforeString][participant.attendance!.option!].count++;
                totals[band.beforeString][participant.attendance!.option!].tooltip += `${participant.basic.name}, \n`
                break;
              }
            }
          }
        }
      }

      let totalsBeforeDeadline: Record<string, Record<number, { count: number; band: (typeof computedBands)[0] }>> = {};

      for (const participant of validPrevParticipants) {
        if (differenceInYears(startDate!, participant.basic.dob) < 5) {
          continue;
        } else {
          for (const band of computedBands) {
            if (band.beforeDate! > participant.created) {
              if (!totalsBeforeDeadline[band.beforeString]) totalsBeforeDeadline[band.beforeString] = {};
              if (!totalsBeforeDeadline[band.beforeString][participant.attendance!.option!]) totalsBeforeDeadline[band.beforeString][participant.attendance!.option!] = { count: 0, band: band };
              totalsBeforeDeadline[band.beforeString][participant.attendance!.option!].count++;
              break;
            }
          }
        }
      }

      const totalNow = Object.entries(totals).reduce((a, c) => {
        return a + Object.entries(c[1]).reduce((a, c) => a + c[1].count * c[1].band.fees[c[0]], 0);
      }, 0);

      const totalBeforeDeadline = Object.entries(totalsBeforeDeadline).reduce((a, c) => {
        return a + Object.entries(c[1]).reduce((a, c) => a + c[1].count * c[1].band.fees[c[0]], 0);
      }, 0);

      const results: FeeLine[] = [];

      const region = organisations.find((o) => o[0] === booking.basic?.organisation)?.[1];
      if (region && feeData.regionalPrices && feeData.regionalPrices[region]) {
        const price = feeData.regionalPrices[region];
        const paying = validParticipants.length - free;
        if (free > 0) results.push({ description: `${free} Under 5s for free`, values: [0] });
        if (paying > 0) results.push({ description: `${paying} ${paying == 1 ? "Person" : "People"} for the ${region} price`, values: [paying * price] });
        return results;
      }

      if (free > 0) results.push({ description: `${free} Under 5s for free`, values: [0] });
      for (const [band, item] of Object.entries(totals)) {
        for (const [index, option] of Object.entries(item)) {
          results.push({
            description: `${option.count} ${option.count == 1 ? "Person" : "People"} for the ${event.attendanceData!.options![index]} ${option.band.description || ""}`,
            tooltip: option.tooltip,
            values: [option.count * option.band.fees[index]],
          });
        }
      }

      if (totalNow < totalBeforeDeadline)
        results.push({
          description: "Cancellation Fees",
          values: [(totalBeforeDeadline - totalNow) / 2],
          tooltip: `50% of the difference between the total fees at the booking deadline (${currency(totalBeforeDeadline)}) and now (${currency(totalNow)})`,
        });

      return results;
    } else {
      return [];
    }
  };

  public DescriptionElement = ({ event, booking }: { event: JsonEventType; booking: PartialDeep<JsonBookingType> }) => {
    const feeData = event.feeData as EalingFeeEventType["feeData"];
    const valueHeaders = this.getValueLabels().map((l, i) => (
      <TableCell component="th" key={i}>
        <b>{l}</b>
      </TableCell>
    ));

    const totals: number[] = [];

    let paymentTotal = 0;

    const payments = booking.fees
      ?.filter((f) => f.type === "payment")
      .map((f, i) => {
        paymentTotal += f.value;
        return (
          <TableRow key={`payment-${i}`}>
            <TableCell>{f.description}</TableCell>
            {this.getValueLabels().map((l, i) => (
              <TableCell component="th" key={i}></TableCell>
            ))}
            <TableCell component="th" key={i}>
              {currency(f.value)}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        );
      });

    const myfees = this.getFeeLines(event, booking).map((row, i) => {
      row.values.forEach((v, i) => {
        if (!totals[i]) totals[i] = 0;
        totals[i] += v;
      });

      return (
        <TableRow key={i} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
          <TableCell component="th" scope="row">
            <Tooltip followCursor={true} title={row.tooltip}>
              <span>{row.description}</span>
            </Tooltip>
          </TableCell>
          {row.values.map((v, i) => (
            <TableCell key={i}>{currency(v)}</TableCell>
          ))}
          {payments && payments.length > 0 ? <TableCell></TableCell> : null}
          <TableCell></TableCell>
        </TableRow>
      );
    });

    const adjustments = booking.fees
      ?.filter((f) => f.type === "adjustment")
      .map((f, i) => {
        totals.forEach((v, i) => {
          if (!totals[i]) totals[i] = 0;
          totals[i] += f.value;
        });

        return (
          <TableRow key={`adjustment-${i}`}>
            <TableCell>{f.description}</TableCell>
            {this.getValueLabels().map((l, i) => (
              <TableCell component="th" key={i}>
                {currency(f.value)}
              </TableCell>
            ))}
            {payments && payments.length > 0 ? <TableCell></TableCell> : null}
            <TableCell></TableCell>
          </TableRow>
        );
      });

    return (
      <>
        <Typography mt={2} variant="body1">
          Once you have submitted your booking you will be sent an invoice via email.
        </Typography>
        <Typography mt={1} variant="body1">
          Please note your booking is only secure after you have paid 50% of your camp fees. The deposit is non-refundable but will be taken out of your group’s remaining balance.
        </Typography>
        <Typography mt={1} variant="body1">
          You need to have paid the remaining balance for your group by 10 June 2025 but please make payments as soon as your group can afford to.
        </Typography>
        <Typography mt={1} variant="body1">
          Your Payment Reference is <b>{this.getPaymentReference(booking as PartialDeep<JsonBookingType> & { userId: string })}</b> - please use this reference for all payments.
        </Typography>
        <List dense={true}>
          <ListItem>
            <ListItemIcon>
              <Description />
            </ListItemIcon>
            <ListItemText>
              <a href="https://camp100.org.uk/wp-content/uploads/2024/06/payment_policy_v1.pdf" target="_blank">
                Payment Policy
              </a>
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Description />
            </ListItemIcon>
            <ListItemText>
              <a href="https://camp100.org.uk/wp-content/uploads/2024/06/how_to_pay_v1.pdf" target="_blank">
                How To Pay
              </a>
            </ListItemText>
          </ListItem>
        </List>
        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                {valueHeaders}
                {payments && payments.length > 0 ? (
                  <TableCell>
                    <b>Payments</b>
                  </TableCell>
                ) : null}
                <TableCell>
                  <b>Balance</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myfees}
              {adjustments}
              {payments}
              <TableRow>
                <TableCell>
                  <b>Total</b>
                </TableCell>
                {totals.map((v, i) => (
                  <TableCell key={i}>
                    <b>{currency(v)}</b>
                  </TableCell>
                ))}
                {payments && payments.length > 0 ? (
                  <TableCell>
                    <b>{currency(paymentTotal)}</b>
                  </TableCell>
                ) : null}
                <TableCell>
                  <b>{currency(totals[0] - paymentTotal)}</b>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <this.PaymentElement event={event} />
      </>
    );
  };

  public PaymentElement = ({ event }: { event: JsonEventType }) => {
    const feeData = event.feeData as EalingFeeEventType["feeData"];
    return <Markdown>{feeData.paymentInstructions}</Markdown>;
  };

  public EmailElement = ({ event, booking }: { event: EventType; booking: BookingType }) => {
    const feeData = event.feeData as EalingFeeEventType["feeData"];
    const valueHeaders = this.getValueLabels().map((l, i) => <th key={i}>{l}</th>);

    let totalOwed = 0;
    let totalPaid = 0;

    const feeLines = this.getFeeLines(event, booking).map((row, i) => {
      totalOwed += row.values[0];
      return (
        <tr key={i}>
          <td>{row.description}</td>
          {row.values.map((v, i) => (
            <td key={i}>{currency(v)}</td>
          ))}
        </tr>
      );
    });

    const adjustmentLines = booking.fees
      ?.filter((f) => f.type === "adjustment")
      .map((f, i) => {
        totalOwed += f.value;
        return (
          <tr key={i}>
            <td>{f.description}</td>
            <td>{currency(f.value)}</td>
          </tr>
        );
      });

    const paymentLines = booking.fees
      ?.filter((f) => f.type === "payment")
      .map((f, i) => {
        totalPaid += f.value;
        return (
          <tr key={i}>
            <td>{f.description}</td>
            <td>{currency(f.value)}</td>
          </tr>
        );
      });

    return (
      <>
        {feeData.paymentInstructions ? (
          <EmailMarkdown
            children={feeData.paymentInstructions}
            markdownCustomStyles={{
              p: { fontSize: "14px" },
            }}
          />
        ) : null}
        <table>
          <thead>
            <tr>
              <th>Detail of product:</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {feeLines}
            {adjustmentLines}
            <tr>
              <td>
                <b>Total: </b>
              </td>
              <td>
                <b>{currency(totalOwed)}</b>
              </td>
            </tr>
            {paymentLines.length > 0 ? (
              <>
                <tr>
                  <td colSpan={2} align="center">
                    <b>Payments Received:</b>
                  </td>
                </tr>
                {paymentLines}
                <tr>
                  <td>
                    <b>Total: </b>
                  </td>
                  <td>
                    <b>{currency(totalPaid)}</b>
                  </td>
                </tr>
              </>
            ) : null}
          </tbody>
        </table>
        <p>
          <b>Balance: {currency(totalOwed - totalPaid)}</b>
        </p>
      </>
    );
  };

  getFeeRemaining(event: JsonEventType, booking: JsonBookingType): number {
    const feeLines = this.getFeeLines(event, booking);

    let totalOutstanding = 0;

    for (const feeLine of feeLines) {
      totalOutstanding += feeLine.values[0];
    }

    for (const payment of booking.fees) {
      if (payment.type === "payment") {
        totalOutstanding -= payment.value;
      }
      if (payment.type === "adjustment") {
        totalOutstanding += payment.value;
      }
    }
    return totalOutstanding;
  }

  public getValueLabels = () => ["Fee"];

  public getPaymentReference(booking: (PartialDeep<JsonBookingType> | BookingType) & { userId: string }) {
    return `C100-${booking.userId.toUpperCase().substring(0, 5)}`;
  }

  public StripeElement = ({ event, booking }: { event: JsonEventType; booking: JsonBookingType }) => {
    const env = useContext(EnvContext);
    const [donation, setDonation] = React.useState(false);
    if (!env.stripe) return null;
    if (booking.participants.length > 3) return null;
    const outstanding = this.getFeeRemaining(event, booking);
    if (outstanding <= 0) return null;
    return (
      <>
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" mt={2} sx={{ flexGrow: 1, pr: 2 }}>
            As you are booking three or fewer people you can pay by card now:
          </Typography>
          <FormGroup>
            <FormControlLabel sx={{ mt: 2, ml: 2 }} control={<Switch checked={donation} onChange={() => setDonation(!donation)} />} label="Donate extra £5" />
          </FormGroup>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => (window.location.href = `/api/event/${event.id}/redirectToStripe?donate=${donation.toString()}`)}>
            Pay by card
          </Button>
        </Box>
      </>
    );
  };

  public processBookingUpdate(
    event: JsonEventType | EventType,
    existingBooking: BookingType | Partial<BookingType> | PartialDeep<JsonBookingType>,
    newBooking: BookingType | Partial<BookingType> | PartialDeep<JsonBookingType>
  ) {
    const eventDeadlineTime = parseDate(event.bookingDeadline)!.getTime();

    const newParticipants = newBooking.participants || [];
    const existingParticipants = existingBooking.participants || [];

    if (Date.now() < eventDeadlineTime) {
      newBooking.extraFeeData = newBooking.extraFeeData || {};
      newBooking.extraFeeData.participantsAtDeadline = newParticipants.map((p) => {
        return { basic: p.basic, attendance: p.attendance, created: p.created, updated: p.updated };
      });
    } else {
      newBooking.extraFeeData = newBooking.extraFeeData || {};
      newBooking.extraFeeData.participantsAtDeadline =
        newBooking.extraFeeData.participantsAtDeadline ||
        existingParticipants.map((p) => {
          return { basic: p.basic, attendance: p.attendance, created: p.created, updated: p.updated };
        });
    }
  }
}

const currency = (c) => c.toLocaleString(undefined, { style: "currency", currency: "GBP" });

const FeeBandConfig = ({
  attendanceData,
  data,
  update,
}: {
  attendanceData: JsonEventType["attendanceData"];
  data: PartialDeep<Required<JsonEventType["feeData"]>["largeCampBands"][0]>;
  update: any;
}) => {
  const { updateDate, updateNumber, updateSubField, updateField } = getMemoUpdateFunctions(update);
  const { setArrayItem } = getMemoUpdateFunctions(updateSubField("fees"));

  const feeFields = (attendanceData?.options || []).map((option, i) => {
    return (
      <TextField
        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
        key={i}
        sx={{ ml: 2, width: 200 }}
        id="outlined-required"
        label={option}
        type="number"
        value={data?.fees?.[i]}
        onChange={setArrayItem(i)}
      />
    );
  });

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <DateTimePicker label="Before" value={parseDate(data.before)} onChange={updateDate("before")} timezone="UTC" />
      <TextField sx={{ ml: 2, width: 200 }} id="outlined-required" label={"description"} value={data?.description} onChange={updateField("description")} />
      {feeFields}
    </Paper>
  );
};
