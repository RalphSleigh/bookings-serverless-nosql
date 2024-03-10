import { Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import React from "react";
import { JsonEventType, JsonUserResponseType } from "../../lambda-common/onetable.js";
import { JsonBookingWithExtraType } from "../../shared/computedDataTypes.js";
import { getFee } from "../../shared/fee/fee.js";
import { Link } from "react-router-dom";

const capitalizeWord = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
};

export function ApplicationThanksPage({ event, user }: { event: JsonEventType, user: JsonUserResponseType }) {
    return <Grid container spacing={2} p={2}>
        <Grid xs={12} item>
            <Paper elevation={3}>
                <Box p={2}>
                    <Typography variant="h4">Thanks for your interest in {event.name}</Typography>
                    <Typography mt={2} variant="body1">You will be e-mailed on {user.email} when one of our team has approved you to book.</Typography>
                </Box>
            </Paper>
        </Grid>
    </Grid>
}
