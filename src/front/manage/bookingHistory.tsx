import React, { useCallback, useContext, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { managePageContext } from "./managePage.js";
import { Avatar, AvatarGroup, Box, Button, FormControl, Grid, InputLabel, MenuItem, Modal, Paper, Select, Stack, Typography } from "@mui/material";
import { UserContext } from "../user/userContext.js";
import { useCreateRole, useEventRoles, useHistoricalEventBookingSingle } from "../queries.js";
import ReactDiffViewer from 'react-diff-viewer-continued';

export function Component() {
  const { event, bookings, displayDeleted } = useOutletContext<managePageContext>();
  const user = useContext(UserContext)!;
  const { eventId, userId } = useParams();
  const historyData = useHistoricalEventBookingSingle(eventId, userId).data;

  const versions = historyData.bookings.map((b) => b.version);

  const [start, setStart] = useState<number>(versions.length - 2);
  const [end, setEnd] = useState<number>(versions.length - 1);

  const startItems = versions.map((v, i) => {
    return (
      <MenuItem key={i} value={i.toString()}>
        {v}
      </MenuItem>
    );
  });

  const startData = historyData.bookings[start];
  const endData = historyData.bookings[end];

  if (!startData || !endData) {
    return (
      <>
        <Grid xs={12} p={2} item>
          <FormControl>
            <InputLabel id={`Start`}>Start</InputLabel>
            <Select value={start} label="Start" onChange={(e) => setStart(parseInt(e.target.value))} labelId={`Start`}>
              {startItems}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id={`End`}>End</InputLabel>
            <Select value={end} label="End" onChange={(e) => setEnd(parseInt(e.target.value))} labelId={`End`}>
              {startItems}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={() => {
              setStart(start - 1);
              setEnd(end - 1);
            }}
          >
            Back
          </Button>
        </Grid>
      </>
    );
  }

  startData.participants = startData.participants
    .sort((a, b) => a.basic.name.localeCompare(b.basic.name))
    .map((p) => {
      //@ts-expect-error
      delete p.created;
      //@ts-expect-error
      delete p.updated;
      return p;
    });
  endData.participants = endData.participants
    .sort((a, b) => a.basic.name.localeCompare(b.basic.name))
    .map((p) => {
      //@ts-expect-error
      delete p.created;
      //@ts-expect-error
      delete p.updated;
      return p;
    });

  //@ts-expect-error
  delete startData.created;
  //@ts-expect-error
  delete startData.updated;
  //@ts-expect-error
  delete endData.created;
  //@ts-expect-error
  delete endData.updated;

  return (
    <>
      <Grid xs={12} p={2} item>
        <FormControl>
          <InputLabel id={`Start`}>Start</InputLabel>
          <Select value={start} label="Start" onChange={(e) => setStart(parseInt(e.target.value))} labelId={`Start`}>
            {startItems}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id={`End`}>End</InputLabel>
          <Select value={end} label="End" onChange={(e) => setEnd(parseInt(e.target.value))} labelId={`End`}>
            {startItems}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={() => {
            setStart(start - 1);
            setEnd(end - 1);
          }}
        >
          Back
        </Button>
      </Grid>
      <Grid xs={12} p={2} item>
        <ReactDiffViewer.default showDiffOnly={false} oldValue={startData} newValue={endData} splitView={false} compareMethod={ReactDiffViewer.DiffMethod.JSON}/>
      </Grid>
    </>
  );
}
