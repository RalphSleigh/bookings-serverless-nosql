import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { managePageContext } from "./managePage.js";
import { Box, Button, Grid, MenuItem, Modal, Paper, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParticipantNumbersChartData } from "../queries.js";
import { format } from "date-fns";

export function Component() {
  const { event, bookings, displayDeleted } = useOutletContext<managePageContext>()

  const data = useParticipantNumbersChartData(event.id).data.participantTotals

  const graphData = data.map(d => { return { total: d.total, time: Date.parse(d.day) } })

  return <>
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
          <XAxis
            dataKey='time'
            domain={['auto', 'auto']}
            name='Time'
            tickFormatter={(unixTime) => format(unixTime, 'dd/MM/yyyy')}
            type='number'
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </Grid></>
}