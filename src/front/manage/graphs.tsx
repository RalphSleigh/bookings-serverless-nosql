import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { managePageContext } from "./managePage.js";
import { Box, Button, Grid, MenuItem, Modal, Paper, Tab, Table, TableCell, TableRow, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useParticipantNumbersChartData } from "../queries.js";
import { format } from "date-fns";

export function Component() {
  const { event, bookings, displayDeleted } = useOutletContext<managePageContext>();

  const graphDataQuery = useParticipantNumbersChartData(event.id).data;

  const graphData = graphDataQuery.participantTotals.map((d) => {
    return { total: d.total, time: Date.parse(d.day) };
  });

  const tableRows = Object.entries(graphDataQuery.countPerUser)
    .sort((a, b) => b[1] - a[1])
    .map(([userId, count], i) => {
      const booking = bookings.find((b) => b.userId === userId && b.version === "latest");
      if (!booking) return null;
      return (
        <TableRow key={i}>
          <TableCell>{booking.basic.district}</TableCell>
          <TableCell>{count}</TableCell>
          <TableCell>{count / booking.participants.length}</TableCell>
        </TableRow>
      );
    });

  return (
    <>
      <Grid xs={12} p={2} item>
        <ResponsiveContainer width="100%" aspect={3}>
          <LineChart
            width={500}
            height={300}
            data={graphData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" domain={["auto", "auto"]} name="Time" tickFormatter={(unixTime) => format(unixTime, "dd/MM/yyyy")} type="number" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </Grid>
      <Grid xs={12} p={2} item>
        <Typography variant="h5">Edits per person</Typography>
        <Table>
          <TableRow>
            <TableCell>District</TableCell>
            <TableCell>Edits</TableCell>
            <TableCell>Per person booked</TableCell>
          </TableRow>
          {tableRows}
        </Table>
      </Grid>
    </>
  );
}
