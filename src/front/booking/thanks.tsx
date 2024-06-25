import { Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import React from "react";
import { JsonEventType, JsonUserResponseType } from "../../lambda-common/onetable.js";
import { JsonBookingWithExtraType } from "../../shared/computedDataTypes.js";
import { getFee } from "../../shared/fee/fee.js";
import { Link } from "react-router-dom";

const capitalizeWord = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
};

export function ThanksPage({ event, booking, user }: { event: JsonEventType, booking: JsonBookingWithExtraType, user: JsonUserResponseType }) {

    const fee = getFee(event)

    const people = booking.participants.map((p, i) => <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component="th" scope="row">{p.basic?.name}</TableCell>
        <TableCell component="td">{p.ageGroup.displayAgeGroup(p.age)}</TableCell>
        <TableCell component="td">{capitalizeWord(p.kp?.diet!)}</TableCell>
    </TableRow>)

    if (event.bigCampMode) {
        return <Grid container spacing={2} p={2}>
            <Grid xs={12} item>
                <Paper elevation={3}>
                    <Box p={2}>
                        <Typography variant="h4">{`Thanks for booking for  ${event.name}`}</Typography>
                        <Typography mt={2} variant="body1">You can come back and <Link to={`/event/${event.id}/edit-my-booking`}>edit</Link> your booking at any time before 18 May 2025. After 18 May you will no longer be able to add new campers but will be able to edit details for those booked until the payment deadline of 10 June 2025.</Typography>
                        <Typography mt={2} variant="h5">Campers booked</Typography>
                        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
                            <Table size="small">
                                <TableBody>
                                    {people}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Typography mt={2} variant="h5">Pricing</Typography>
                        <fee.DescriptionElement event={event} booking={booking} />
                        <fee.StripeElement event={event} booking={booking}/>
                        <Typography mt={2} variant="body1">If you have any questions, or need to get in touch for any reason please contact <a href={`mailto:${event.replyTo}`}>{event.replyTo}</a></Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    } else {
        return <Grid container spacing={2} p={2}>
            <Grid xs={12} item>
                <Paper elevation={3}>
                    <Box p={2}>
                        <Typography variant="h4">{`Thanks for booking for  ${event.name}`}</Typography>
                        <Typography mt={2} variant="body1">You can come back and <Link to={`/event/${event.id}/edit-my-booking`}>edit</Link> your booking at any time before the deadline</Typography>
                        <Typography mt={2} variant="h5">Campers booked</Typography>
                        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
                            <Table size="small">
                                <TableBody>
                                    {people}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Typography mt={2} variant="h5">Pricing</Typography>
                        <fee.DescriptionElement event={event} booking={booking} />
                        <fee.StripeElement event={event} booking={booking}/>
                        <Typography mt={2} variant="body1">If you have any questions, or need to get in touch for any reason please contact <a href={`mailto:${event.replyTo}`}>{event.replyTo}</a></Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    }
}
/*
<h3>Thanks for booking for {event.name}</h3>
<p>You can come back and <Link to={"/event/" + event.id + "/book"}>edit</Link> your booking at any time
    before the deadline</p>
<h4>Participants booked</h4>
<Table striped>
    <thead>
    <tr>
        <th>Name</th>
        <th>Age</th>
        <th>Diet</th>
    </tr>
    </thead>
    <tbody>
    {participants}
    </tbody>
</Table>
</Col>
</Row>
<Row>
<Col sm={12}>
<h4>Money</h4>
<ReactMarkdown  children={event.feeData.desc}/>
</Col>
</Row>
<this.fees.ThanksRow
event={this.event}
booking={booking}/>
<Row>
<Col sm={12}>
<ReactMarkdown  children={paymentText}/>
</Col>
</Row>
<Row>
<Col>
    <p>If you have any questions, or need to get in touch for any reason please contact <a href={`mailto:${event.customQuestions.emailReply}`}>{event.customQuestions.emailReply}</a></p
    */