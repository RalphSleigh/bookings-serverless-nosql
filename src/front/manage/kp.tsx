import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { JsonEventType, JsonParticipantType, JsonUserResponseType } from "../../lambda-common/onetable.js";
import { managePageContext } from "./managePage.js";
import { Button, Grid, Modal, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { ParticipantFields } from "../../shared/participantFields.js";
import { DataGrid, GridCallbackDetails, GridRowParams, MuiEvent } from "@mui/x-data-grid";
import { JsonBookingWithExtraType, JsonParticipantWithExtraType } from "../../shared/computedDataTypes.js";
import { UserContext } from "../user/userContext.js";
import { BookingFields } from "../../shared/bookingFields.js";
import { stringify } from 'csv-stringify/browser/esm/sync';
import save from "save-file";
import format from "date-fns/format";
import { embedLength } from "discord.js";
import { de } from "date-fns/locale";
import { getKP } from "../../shared/kp/kp.js";
import { ageGroups } from "../../shared/woodcraft.js";
import { KpStructure } from "../../shared/kp/kp_class.js";
import { RequiredDeep } from "type-fest";

export function Component() {
    const { event, bookings, displayDeleted } = useOutletContext<managePageContext>()

    let KP: React.FC<{ event: JsonEventType, bookings: RequiredDeep<JsonBookingWithExtraType[]> }>

    switch (event.kpMode) {
        case "basic":
            KP = BasicKP
            break
        case "large":
            KP = LargeKP
            break
        default:
            KP = BasicKP
    }

    return <KP event={event} bookings={bookings.filter(b => !b.deleted || displayDeleted) as RequiredDeep<JsonBookingWithExtraType[]>}/>
}

const BasicKP = ({ event, bookings }: { event: JsonEventType, bookings: JsonBookingWithExtraType[] }) => {

    const kp = getKP(event)
    const counts: number[][] = []
    const requirements: JsonParticipantWithExtraType[] = []

    const groups = ageGroups().reverse()

    for (let booking of bookings) {
        for (let participant of booking.participants) {
            const ageIndex = groups.findIndex(g => g.name == participant.ageGroup.name)
            const dietIndex = KpStructure.dietOptions.findIndex(d => d == participant.kp!.diet)
            counts[ageIndex] = counts[ageIndex] || new Array(KpStructure.dietOptions.length).fill(0)
            counts[ageIndex][dietIndex]++
            if (participant.kp?.details && participant.kp?.details !== "") requirements.push(participant)
        }
    }

    const headerRow = KpStructure.dietOptions.map(d => <TableCell key={d}><strong>{capitalize(d)}</strong></TableCell>)

    const countRows = counts.map((row, i) => {
        const total = row.reduce((a, b) => a + b, 0)
        return <TableRow key={i}>
            <TableCell><strong>{groups[i].name}</strong></TableCell>
            {row.map((count, j) => <TableCell key={j}>{count}</TableCell>)}
            <TableCell><strong>{total}</strong></TableCell>
        </TableRow>
    })

    const requirementRows = requirements.map((p, i) => <TableRow key={i}>
        <TableCell>{p.basic.name}</TableCell>
        <TableCell>{p.ageGroup.displayAgeGroup(p.age)}</TableCell>
        <TableCell>{p.kp?.details}</TableCell>
    </TableRow>)

    return <Grid xs={12} p={2} item>
        <Typography variant="h6">Numbers</Typography>
        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        {headerRow}
                        <TableCell><strong>Total</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {countRows}
                    <TableRow>
                        <TableCell><strong>Total</strong></TableCell>
                        {KpStructure.dietOptions.map((d, i) => {
                            const total = counts.reduce((a, b) => a + b[i], 0)
                            return <TableCell key={i}><strong>{total}</strong></TableCell>
                        })}
                        <TableCell><b>{counts.reduce((a, b) => a + b.reduce((a, b) => a + b, 0), 0)}</b></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
        <Typography variant="h6" sx={{ mt: 2 }}>Requirements & Allergies</Typography>
        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Age</strong></TableCell>
                        <TableCell><strong>Details</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {requirementRows}
                </TableBody>
            </Table>
        </TableContainer>
    </Grid>
}

const LargeKP = ({ event, bookings }: { event: JsonEventType, bookings: RequiredDeep<JsonBookingWithExtraType[]> }) => {

    const kp = getKP(event)
    const counts: number[][] = []
    const requirements: RequiredDeep<JsonParticipantWithExtraType[]> = []

    const groups = ageGroups().reverse()

    for (let booking of bookings) {
        for (let participant of booking.participants) {
            const ageIndex = groups.findIndex(g => g.name == participant.ageGroup.name)
            const dietIndex = KpStructure.dietOptions.findIndex(d => d == participant.kp!.diet)
            counts[ageIndex] = counts[ageIndex] || new Array(KpStructure.dietOptions.length).fill(0)
            counts[ageIndex][dietIndex]++
            if (isNonEmptyString(participant.kp.details) ||
                isNonEmptyString(participant.kp.preferences) ||
                participant.kp.dairy ||
                participant.kp.soya ||
                participant.kp.gluten ||
                participant.kp.nuts ||
                participant.kp.egg ||
                participant.kp.pork ||
                participant.kp.chickpea ||
                participant.kp.diabetic ||
                participant.kp.contactMe) requirements.push(participant)
        }
    }

    const headerRow = KpStructure.dietOptions.map(d => <TableCell key={d}><strong>{capitalize(d)}</strong></TableCell>)

    const countRows = counts.map((row, i) => {
        const total = row.reduce((a, b) => a + b, 0)
        return <TableRow key={i}>
            <TableCell><strong>{groups[i].name}</strong></TableCell>
            {row.map((count, j) => <TableCell key={j}>{count}</TableCell>)}
            <TableCell><strong>{total}</strong></TableCell>
        </TableRow>
    })


    const requirementRows = requirements.map((p, i) => {
    
        const no = [[p.kp.dairy, "Dairy"],
        [p.kp.soya, "Soya"],
        [p.kp.egg, "Egg"],
        [p.kp.gluten, "Gluten"],
        [p.kp.pork, "Pork"],
        [p.kp.nuts, "Nuts"],
        [p.kp.chickpea, "Chickpea"]].filter(i => i[0]).map(i => i[1]).join(", ")

    return <TableRow key={i}>
        <TableCell sx={{verticalAlign: 'top'}}>{p.basic.name}</TableCell>
        <TableCell sx={{verticalAlign: 'top'}}>{p.ageGroup.displayAgeGroup(p.age)}</TableCell>
        <TableCell sx={{verticalAlign: 'top'}}>{p.attendance.option}</TableCell>
        <TableCell sx={{verticalAlign: 'top'}}>{p.kp.diet}</TableCell>
        <TableCell>
            {isNonEmptyString(p.kp.details) ? <><strong>Requirements:</strong>< br />
                {p.kp.details}
                <br /><br /></> : null}
            {isNonEmptyString(p.kp.preferences) ? <><strong>Preferences:</strong>< br />
            {p.kp.preferences}
            <br /><br /></> : null}
            { no ? <><strong>No: </strong>{no}<br /></> : null}
            {p.kp.diabetic ? <><strong>Diabetic</strong><br /></> : null}
            {p.kp.contactMe ? <strong>Needs are complex, please contact me</strong> : null}
        </TableCell>
    </TableRow>})

    return <Grid xs={12} p={2} item>
        <Typography variant="h6">Numbers</Typography>
        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        {headerRow}
                        <TableCell><strong>Total</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {countRows}
                    <TableRow>
                        <TableCell><strong>Total</strong></TableCell>
                        {KpStructure.dietOptions.map((d, i) => {
                            const total = counts.reduce((a, b) => a + b[i], 0)
                            return <TableCell key={i}><strong>{total}</strong></TableCell>
                        })}
                        <TableCell><b>{counts.reduce((a, b) => a + b.reduce((a, b) => a + b, 0), 0)}</b></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
        <Typography variant="h6" sx={{ mt: 2 }}>Requirements & Allergies</Typography>
        <TableContainer component={Paper} sx={{ mt: 2, p: 1 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Age</strong></TableCell>
                        <TableCell><strong>Attendance</strong></TableCell>
                        <TableCell><strong>Diet</strong></TableCell>
                        <TableCell><strong>Details</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {requirementRows}
                </TableBody>
            </Table>
        </TableContainer>
    </Grid>
}

const capitalize = (str: string = "", lowerRest = false): string =>
    str.slice(0, 1).toUpperCase() +
    (lowerRest ? str.slice(1).toLowerCase() : str.slice(1));

const isNonEmptyString = (str: string | undefined): boolean => str !== undefined && str !== ""