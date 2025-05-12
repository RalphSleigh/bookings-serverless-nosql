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
import { Close, ContentCopy, Edit, Email, StackedBarChart } from "@mui/icons-material";
import { getMemoUpdateFunctions } from "../../shared/util.js";
import { eventApplicationsQuery, eventApplicationsQueryType, eventRolesQuery, eventRolesQueryType, useApplicationOperation, useBookingOperation, useEventOperation } from "../queries.js";
import { applicationTypeIcon } from "./utils.js";
import { groupParticipants } from "../../shared/woodcraft.js";
import { JsonBookingType, JsonEventType, JsonParticipantType } from "../../lambda-common/onetable.js";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSuspenseQueries } from "@tanstack/react-query";

const TownsSummary: React.FC<{ event: JsonEventType; bookings: JsonBookingType[] }> = ({ event, bookings }) => {
  const towns = new Set<string>();
  event.villages?.forEach((v) => {
    towns.add(v.town);
  });
  const rows = Array.from(towns).map((town, i) => {
    const villagesInTown = event.villages?.filter((v) => v.town === town).map((v) => v.name);
    const bookingsInTown = bookings.filter((b) => villagesInTown?.includes(b.village || "") && !b.deleted);
    const participants = bookingsInTown.reduce<JsonParticipantType[]>((a, c) => {
      return [...a, ...c.participants];
    }, []);

    return (
      <TableRow key={i}>
        <TableCell>{town}</TableCell>
        <TableCell>{villagesInTown?.length}</TableCell>
        <TableCell>{participants.length}</TableCell>
      </TableRow>
    );
  });

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <b>Town</b>
            </TableCell>
            <TableCell>
              <b>Villages</b>
            </TableCell>
            <TableCell>
              <b>Participants</b>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </TableContainer>
  );
};

const AddVillageWidget: React.FC<{ event: JsonEventType }> = ({ event }) => {
  const [newVillage, setNewVillage] = useState({ name: "", town: "" });
  const { updateField } = getMemoUpdateFunctions(setNewVillage);

  const eventOperation = useEventOperation(event.id);

  const submit = (e) => {
    eventOperation.mutate({ operation: { type: "addVillage", name: newVillage.name.trim(), town: newVillage.town.trim() } });
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

  const [roleData, applicationsData] = useSuspenseQueries<[eventRolesQueryType, eventApplicationsQueryType]>({
    queries: [eventRolesQuery(event.id), eventApplicationsQuery(event.id)],
  });

  const applicationOperation = useApplicationOperation(event.id);

  const waitingApplications = applicationsData.data.applications.filter((a) => rawBookings.find((b) => b.userId === a.userId) === undefined);

  const eventOperation = useEventOperation(event.id);
  const bookingOperation = useBookingOperation();

  const removeVillage = (name) => (e) => {
    eventOperation.mutate({ operation: { type: "removeVillage", name: name } });
    e.preventDefault();
  };

  const unassignVillage = (userId) => (e) => {
    bookingOperation.mutate({ eventId: event.id, userId: userId, operation: { type: "unassignVillage", village: e.target.value } });
  };

  const rows = event.villages
    ?.sort((a, b) => `${a.name} ${a.town}`.localeCompare(`${b.name} ${b.town}`))
    .map((v, i) => {
      const bookingsInVillage = rawBookings.filter((b) => b.village === v.name && !b.deleted);
      const participants = bookingsInVillage.reduce<JsonParticipantWithExtraType[]>((a, c) => {
        return [...a, ...c.participants];
      }, []);

      const applicationsInVillage = waitingApplications.filter((a) => a.village === v.name);

      const totalsString = groupParticipants(participants, event)
        .filter((g) => g.participants.length > 0)
        .map((g) => `${g.group.name}: ${g.participants.length}`)
        .join(", ");

      const appliedTotal = applicationsInVillage.reduce((a, c) => a + c.predictedParticipants, 0);

      const over16firstThree = participants.filter((p) => p.age >= 16 && (p.attendance.option === 0 || p.attendance.option === 1)).length;
      const under16firstThree = participants.filter((p) => p.age < 16 && (p.attendance.option === 0 || p.attendance.option === 1)).length;

      const over16lastSeven = participants.filter((p) => p.age >= 16 && (p.attendance.option === 0 || p.attendance.option === 2)).length;
      const under16lastSeven = participants.filter((p) => p.age < 16 && (p.attendance.option === 0 || p.attendance.option === 2)).length;

      const data = [
        {
          name: "First 3",
          u16: under16firstThree,
          o16: over16firstThree,
          applied: appliedTotal,
        },
        {
          name: "Last 7",
          u16: under16lastSeven,
          o16: over16lastSeven,
          applied: appliedTotal,
        },
      ];

      const renameVillage = (e) => {
        const newName = prompt("Enter new village name", v.name);
        if(event.villages?.find(v => v.name === newName)) {
          alert("Village name already exists");
          return
        }

        if(!newName) return;

        const newTownName = prompt("Enter new town name", v.town);
        if (newName && newTownName) {
          eventOperation.mutate({ operation: { type: "renameVillage", oldName: v.name, newName: newName.trim(), newTownName: newTownName.trim() } });
        }
      };

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

      const tableRowsApplications = applicationsInVillage.map((a, i) => {
        const unassignVillageToApplication = (userId) => (e) => {
          applicationOperation.mutate({ userId, operation: { type: "assignVillageToApplication", userId: userId, village: "" } });
        };

        return (
          <TableRow key={i+"application"}>
            <TableCell>
              {a.name} - {a.district}
            </TableCell>
            <TableCell>{a.predictedParticipants} (predicted)</TableCell>
            <TableCell>
              <IconButton disabled={applicationOperation.isPending} onClick={unassignVillageToApplication(a.userId)} color="warning">
                <Close />
              </IconButton>
            </TableCell>
          </TableRow>
        );
      });

      return (
        <Paper sx={{ p: 2, mb: 2 }} key={i}>
          <Grid container spacing={2} p={0} key={i}>
            <Grid item xs={12}>
              <IconButton sx={{ float: "right" }} disabled={eventOperation.isPending} color="warning" onClick={removeVillage(v.name)} className="hidden-button">
                <Close />
              </IconButton>
              <Stack alignItems="center" gap={1} direction="row">
                <Typography variant="h5" sx={{ mb: 2, mt: 2 }}>
                  {v.name} - {v.town}
                </Typography>
                <IconButton disabled={eventOperation.isPending} color="warning" onClick={renameVillage} className="hidden-button">
                  <Edit />
                </IconButton>
              </Stack>
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    horizontalCoordinatesGenerator={({ yAxis, width, height, offset }) => {
                      const heightPerTen = (offset.height! / yAxis.niceTicks[1]) * 10;
                      const lines: number[] = [];
                      let i = offset.height!;
                      while (i > 0) {
                        lines.push(i);
                        i -= heightPerTen;
                      }
                      return lines;
                    }}
                  />
                  <XAxis dataKey="name" tick={{ dy: 7 }} />
                  <YAxis tickCount={2} />
                  <Tooltip />
                  <Bar type="monotone" dataKey="applied" stackId="1" stroke="#ffcaca" fill="#ffcaca" />
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
                  <TableBody>
                    {tableRows}
                    {tableRowsApplications}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography
                variant="body1"
                sx={{ mt: 1 }}
                color={(t) => (participants.length + appliedTotal < 80 ? t.palette.success.main : participants.length + appliedTotal < 90 ? t.palette.warning.main : t.palette.error.main)}
              >
                <b>Total: {participants.length + appliedTotal}</b> - {totalsString}, applied: {appliedTotal}
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

  const assignVillageToApplication = (userId) => (e) => {
    applicationOperation.mutate({ userId, operation: { type: "assignVillageToApplication", userId: userId, village: e.target.value } });
  };

  const bookingVillages = rawBookings
    .filter((b) => !event.villages?.find((v) => v.name === b.village) && !b.deleted)
    .sort((a, b) => b.participants.length - a.participants.length)
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
          {b.village && b.village !== "" ? <Typography sx={{ mt: 1 }} variant="body2">
            "{b.village}"
          </Typography>: null}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id={`select-village-${i}`}>Village</InputLabel>
            <Select value="" label="Villages" onChange={assignVillage(b.userId)} labelId={`select-village-${i}`} disabled={bookingOperation.isPending}>
              {menuItems}
            </Select>
          </FormControl>
        </Paper>
      );
    });

  const applicationVillages = waitingApplications
    .filter((a) => !a.village)
    .map((a, i) => {
      return (
        <Paper sx={{ p: 2, mb: 2 }} key={i}>
          <Stack alignItems="center" gap={1} direction="row">
            <Typography variant="h6">{a.name} - {a.district}</Typography>
            {applicationTypeIcon(a.bookingType)}
          </Stack>
          <Typography sx={{ mt: 1 }} variant="body2">
            <b>Predicted Campers:</b> {a.predictedParticipants}
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id={`select-village-${i}`}>Village</InputLabel>
            <Select value="" label="Villages" onChange={assignVillageToApplication(a.userId)} labelId={`select-village-${i}`} disabled={bookingOperation.isPending}>
              {menuItems}
            </Select>
          </FormControl>
        </Paper>
      );
    });

  return (
    <Grid container spacing={2} p={2}>
      <AddVillageWidget event={event} />
      <Grid item xs={12}>
        <TownsSummary event={event} bookings={rawBookings} />
      </Grid>
      <Grid item xs={4}>
        {bookingVillages}
        {applicationVillages}
      </Grid>
      <Grid item xs={8}>
        {rows}
      </Grid>
    </Grid>
  );
}
