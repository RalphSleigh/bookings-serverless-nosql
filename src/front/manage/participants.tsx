import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { managePageContext } from "./managePage.js";
import { Grid } from "@mui/material";
import { Fields } from "../../shared/participantFields.js";
import { DataGrid } from "@mui/x-data-grid";

export function Component() {
    const { event, bookings } = useOutletContext<managePageContext>()

    const participants = bookings.reduce<JsonParticipantType[]>((a, c) => {
        return [...a, ...c.participants]
    }, [])

    const columns = new Fields(event).getColumnDefs()

    const rows = useMemo(() => participants.map((p,i) => {
        return { participant: p, id: i }
    }), [participants])

    return <Grid xs={12} p={2} item>
        
        <DataGrid rowSelection={false} pageSizeOptions={[100]} rows={rows} columns={columns} />
    </Grid>

}
