import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { managePageContext } from "./managePage.js";
import { Box, Button, Grid, MenuItem, Modal, Paper, Typography } from "@mui/material";
import { JsonParticipantWithExtraType } from "../../shared/computedDataTypes.js";
import { UserContext } from "../user/userContext.js";
import { addDays, format } from "date-fns";
import { parseDate } from "../../shared/util.js";

export function Component() {
    const { event, bookings, displayDeleted } = useOutletContext<managePageContext>()
    const user = useContext(UserContext)!
    const [selectedParticipant, setSelectedParticipant] = React.useState<number | undefined>(undefined)


    const participants = bookings.filter(b => !b.deleted || displayDeleted).reduce<JsonParticipantWithExtraType[]>((a, c) => {
        return [...a, ...c.participants]
    }, [])

    const birthdays = useMemo(() => {
        const days: { date: Date, participants: JsonParticipantWithExtraType[] }[] = []
        for (let d = parseDate(event.startDate)!; d <= parseDate(event.endDate)!; d = addDays(d, 1)) {
            days.push({ date: new Date(d), participants: participants.filter(p => parseDate(p.basic.dob)!.getMonth() === d.getMonth() && parseDate(p.basic.dob)!.getDate() === d.getDate()) })
        }
        return days
    }, [participants, event])

    const entries = birthdays.map(b => {
        const people = b.participants.map(p => <Typography key={p.basic.name} variant="body1">{p.age < 20 ? `${p.basic.name} ${p.age + 1}` : `${p.basic.name}`}</Typography>)
        return <>
            <Typography variant="h5">{format(b.date, "eee co MMMM")}</Typography>
            {people}
        </>
    })

    return <>
        <Grid xs={12} p={2} item>
            {entries}
        </Grid></>
}