import React, { useCallback, useContext, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { managePageContext } from "./managePage.js";
import { Box, Button, Grid, MenuItem, Modal, Paper, Tab, Table, TableCell, TableRow, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useParticipantNumbersChartData } from "../queries.js";
import { format } from "date-fns";
import { Wordcloud } from '@visx/wordcloud';
import { Text } from '@visx/text';
import { scaleLog } from '@visx/scale';

window.random = Math.random;

export function Component() {
  const { event, bookings, displayDeleted } = useOutletContext<managePageContext>();

  const graphDataQuery = useParticipantNumbersChartData(event.id).data;

  const graphData = graphDataQuery.participantTotals.map((d) => {
    return { total: d.total, time: Date.parse(d.day) };
  });


  const dietString = bookings
  .filter(b => b.version === "latest" && !b.deleted)
  .reduce((acc, booking) => {
    const diets = booking.participants.map((p) => p.kp?.preferences?.trim() || "").filter(s => s !== "").join(" ");
    return acc + " " + diets.trim();
  },"");

  const filteredWords = ["","is", "the", "and", "a", "to", "of", "in", "for", "with", "on", "that", "it", "this", "as", "by", "at", "from", "I"];

  const wordData = wordFreq(dietString).filter(w => !filteredWords.includes(w.text))

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

  const colors = ['#143059', '#2F6B9A', '#82a6c2'];

  const fontScale = scaleLog({
  domain: [Math.min(...wordData.map((w) => w.value)), Math.max(...wordData.map((w) => w.value))],
  range: [10, 100],
});
const fontSizeSetter = (datum: WordData) => fontScale(datum.value);

function getRotationDegree() {
  const rand = Math.random();
  const degree = rand > 0.5 ? 30 : -30;
  return rand * degree;
}

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
        <Wordcloud 
        fontSize={fontSizeSetter}
        spiral='archimedean'
        width={1000}
        height={600}
        font={'Impact'}
        padding={2}
        rotate={getRotationDegree}
        words={wordData}>
          {(cloudWords) =>
          cloudWords.map((w, i) => (
            <Text
              key={w.text}
              fill={colors[i % colors.length]}
              textAnchor={'middle'}
              transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
              fontSize={w.size}
              fontFamily={w.font}
            >
              {w.text}
            </Text>
          ))
        }</Wordcloud>
      </Grid>
    </>
  );
}

interface WordData {
  text: string;
  value: number;
}


function wordFreq(text: string): WordData[] {
  const words: string[] = text.replace(/\./g, '').split(/\s/);
  const freqMap: Record<string, number> = {};

  for (const w of words) {
    if (!freqMap[w]) freqMap[w] = 0;
    freqMap[w] += 1;
  }
  return Object.keys(freqMap).map((word) => ({ text: word, value: freqMap[word] }));
}