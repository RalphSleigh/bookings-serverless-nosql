import React, { useCallback, useContext, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { managePageContext } from "./managePage.js";
import {
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { JsonBookingWithExtraType, JsonParticipantWithExtraType } from "../../shared/computedDataTypes.js";
import { Close, ContentCopy, Email, StackedBarChart } from "@mui/icons-material";
import { getMemoUpdateFunctions } from "../../shared/util.js";
import { eventRolesQuery, useBookingOperation, useEventOperation } from "../queries.js";
import { applicationTypeIcon } from "./utils.js";
import { groupParticipants } from "../../shared/woodcraft.js";
import { JsonEventType } from "../../lambda-common/onetable.js";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AddVillageWidget: React.FC<{ event: JsonEventType }> = ({ event }) => {
  const [newVillage, setNewVillage] = useState({ name: "", town: "" });
  const { updateField } = getMemoUpdateFunctions(setNewVillage);

  const eventOperation = useEventOperation(event.id);

  const submit = (e) => {
    eventOperation.mutate({ operation: { type: "addVillage", name: newVillage.name, town: newVillage.town } });
    e.preventDefault();
  };

  const newEnabled = newVillage.name && newVillage.town && !event.villages?.find((v) => v.name === newVillage.name);

  return (
    <Grid container spacing={2} p={2}>
      <Grid item xs={5}>
        <TextField label="Name" value={newVillage.name} onChange={updateField("name")} fullWidth />
      </Grid>
      <Grid item xs={5}>
        <TextField label="Town" value={newVillage.town} onChange={updateField("town")} fullWidth />
      </Grid>
      <Grid item xs={2}>
        <Button disabled={!newEnabled} onClick={submit}>
          Add Village
        </Button>
      </Grid>
    </Grid>
  );
};

export function Component() {
  const { event, bookings: rawBookings, displayDeleted } = useOutletContext<managePageContext>();

  const eventOperation = useEventOperation(event.id);
  const bookingOperation = useBookingOperation();

  const removeVillage = (name) => (e) => {
    eventOperation.mutate({ operation: { type: "removeVillage", name: name } });
    e.preventDefault();
  };

  const unassignVillage = (userId) => (e) => {
    bookingOperation.mutate({ eventId: event.id, userId: userId, operation: { type: "unassignVillage", village: e.target.value } });
  };

  const rows = event.villages?.map((v, i) => {
    const bookingsInVillage = rawBookings.filter((b) => b.village === v.name && !b.deleted);
    const participants = bookingsInVillage.reduce<JsonParticipantWithExtraType[]>((a, c) => {
      return [...a, ...c.participants];
    }, []);
    const totalsString = groupParticipants(participants, event)
      .filter((g) => g.participants.length > 0)
      .map((g) => `${g.group.name}: ${g.participants.length}`)
      .join(", ");

    const over16firstThree = participants.filter((p) => p.age >= 16 && (p.attendance.option === 0 || p.attendance.option === 1)).length;
    const under16firstThree = participants.filter((p) => p.age < 16 && (p.attendance.option === 0 || p.attendance.option === 1)).length;

    const over16lastSeven = participants.filter((p) => p.age >= 16 && (p.attendance.option === 0 || p.attendance.option === 2)).length;
    const under16lastSeven = participants.filter((p) => p.age < 16 && (p.attendance.option === 0 || p.attendance.option === 2)).length;

    const data = [
      {
        name: "First 3",
        u16: under16firstThree,
        o16: over16firstThree,
      },
      {
        name: "Last 7",
        u16: under16lastSeven,
        o16: over16lastSeven,
      },
    ];

    const tableRows = bookingsInVillage.map((b, i) => {
      return (
        <TableRow key={i}>
          <TableCell>{b.basic.bookingType === "group" ? b.basic.district : b.basic.contactName}</TableCell>
          <TableCell>{b.participants.length}</TableCell>
          <TableCell>
            <IconButton disabled={bookingOperation.isPending} onClick={unassignVillage(b.userId)} color="warning">
              <Close />
            </IconButton>
          </TableCell>
        </TableRow>
      );
    });

    return (
      <Paper sx={{ p: 2, mb: 2 }} key={i}>
        <Grid container spacing={2} p={2} key={i}>
          <Grid item xs={12}>
            <IconButton sx={{ float: "right" }} disabled={eventOperation.isPending} color="warning" onClick={removeVillage(v.name)} className="hidden-button">
              <Close />
            </IconButton>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {v.name} - {v.town}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <ResponsiveContainer width="100%" aspect={1}>
              <BarChart
                width={100}
                height={100}
                data={data}
                margin={{
                  top: 0,
                  right: 0,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{dy: 7 }} />
                <YAxis tickCount={2}/>
                <Tooltip />
                <Bar type="monotone" dataKey="u16" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Bar type="monotone" dataKey="o16" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Grid>
          <Grid item xs={8}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Group</TableCell>
                    <TableCell>Participants</TableCell>
                    <TableCell>Unassign</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{tableRows}</TableBody>
              </Table>
            </TableContainer>
            <Typography variant="body1" sx={{ mt: 1 }} color={(t) => (participants.length < 80 ? t.palette.success.main : participants.length < 90 ? t.palette.warning.main : t.palette.error.main)}>
              <b>Total: {participants.length}</b> - {totalsString}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  });

  const menuItems = event.villages?.map((v, i) => {
    return (
      <MenuItem key={i} value={v.name}>
        {v.name}
      </MenuItem>
    );
  });

  const assignVillage = (userId) => (e) => {
    bookingOperation.mutate({ eventId: event.id, userId: userId, operation: { type: "assignVillage", village: e.target.value } });
  };

  const bookingVillages = rawBookings
    .filter((b) => !event.villages?.find((v) => v.name === b.village) && !b.deleted)
    .map((b, i) => {
      return (
        <Paper sx={{ p: 2, mb: 2 }} key={i}>
          <Stack alignItems="center" gap={1} direction="row">
            <Typography variant="h6">{b.basic.bookingType === "group" ? b.basic.district : b.basic.contactName}</Typography>
            {applicationTypeIcon(b.basic.bookingType)}
          </Stack>
          <Typography sx={{ mt: 1 }} variant="body2">
            <b>Campers:</b> {b.participants.length}
          </Typography>
          <Typography sx={{ mt: 1 }} variant="body2">
            {b.camping?.campWith}
          </Typography>
          <Typography sx={{ mt: 1 }} variant="body2">
            {b.camping?.canBringEquipment}
          </Typography>
          <Typography sx={{ mt: 1 }} variant="body2">
            {b.camping?.accessibilityNeeds}
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id={`select-village-${i}`}>Village</InputLabel>
            <Select value="" label="Villages" onChange={assignVillage(b.userId)} labelId={`select-village-${i}`} disabled={bookingOperation.isPending}>
              {menuItems}
            </Select>
          </FormControl>
        </Paper>
      );
    });

  return (
    <Grid container spacing={2} p={2}>
      <AddVillageWidget event={event} />
      <Grid item xs={4}>
        {bookingVillages}
      </Grid>
      <Grid item xs={8}>
        {rows}
      </Grid>
    </Grid>
  );
}
