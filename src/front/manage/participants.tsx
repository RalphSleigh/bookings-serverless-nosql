import React from "react";
import { useOutletContext } from "react-router-dom";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { managePageContext } from "./managePage.js";
import { Grid } from "@mui/material";

export function Component() {
    const { event, bookings } = useOutletContext<managePageContext>()

    const participants = bookings.reduce<JsonParticipantType[]>((a, c) => {
        return [...a, ...c.participants]
    }, []).map((p, i) => <p key={i}>{p.basic.name}</p>)

    return <Grid xs={12} p={2} item>
        {participants}
    </Grid>

}
