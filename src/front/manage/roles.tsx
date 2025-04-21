import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { allUsersQueryType, eventRolesQueryType, allUsersQuery, eventRolesQuery, useCreateRole, useDeleteRole } from "../queries.js";
import { managePageContext } from "./managePage.js";
import { useQueries, useSuspenseQueries } from "@tanstack/react-query";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { Avatar, Badge, Box, Button, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField, Typography, useTheme } from "@mui/material";
import { Close } from "@mui/icons-material";
import { JsonUserType, RoleType } from "../../lambda-common/onetable.js";

const manageRoles = ["Owner", "Manage", "View", "Money", "KP", "Comms", "Accessibility"];
const bookRoles = ["Book", "Amend"];
const villageRoles = ["View - Village"];

export function Component() {
  const { event, bookings } = useOutletContext<managePageContext>();
  const [userData, roleData] = useSuspenseQueries<[allUsersQueryType, eventRolesQueryType]>({ queries: [allUsersQuery(event.id), eventRolesQuery(event.id)] });

  const [userId, setUserId] = useState<string>("");
  const [role, setRole] = useState<RoleType["role"] | "">("");
  const [village, setVillage] = useState<string>("All");

  const createRole = useCreateRole(event.id);
  const deleteRole = useDeleteRole(event.id);

  const handleUserChange = (event: SelectChangeEvent) => {
    setUserId(event.target.value as string);
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setRole(event.target.value as RoleType["role"] | "");
  };

  const handleVillageChange = (event: SelectChangeEvent) => {
    setVillage(event.target.value);
  };

  const submit = (e) => {
    if (role === "") return;
    if (village === "All") createRole.mutate({ eventId: event.id, userId, role });
    else createRole.mutate({ eventId: event.id, userId, role, village: village });

    e.preventDefault();
  };

  const deleteRoleHandler = (roleId) => (e) => {
    deleteRole.mutate(roleId);
    e.preventDefault();
  };

  const userItems = userData.data?.users
    .filter((u) => u.userName && u.email)
    .sort((a, b) => (a.userName && b.userName ? a.userName?.localeCompare(b.userName) : 0))
    .map((u) => {
      return (
        <MenuItem key={u.id} value={u.id}>
          <Stack direction="row" spacing={1}>
            <WoodcraftAvatar user={u} />
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography>
                {u.userName} ({u.email})
              </Typography>
            </Box>
          </Stack>
        </MenuItem>
      );
    });

  const columns: GridColDef[] = [
    { field: "user", headerName: "User", flex: 10, sortComparator: userSortComparator, renderCell: renderUserCell },
    { field: "role", headerName: "Role", flex: 5 },
    { field: "delete", headerName: "Remove", renderCell: renderDeleteCell(deleteRoleHandler, deleteRole) },
  ];

  const villageColumns: GridColDef[] = [
    { field: "user", headerName: "User", flex: 10, sortComparator: userSortComparator, renderCell: renderUserCell },
    { field: "role", headerName: "Role", flex: 5 },
    { field: "village", headerName: "Village", flex: 5 },
    { field: "delete", headerName: "Remove", renderCell: renderDeleteCell(deleteRoleHandler, deleteRole) },
  ];

  const manageRows = useMemo(
    () =>
      roleData
        .data!.roles.filter((r) => manageRoles.includes(r.role))
        .sort((a, b) => manageRoles.indexOf(a.role) - manageRoles.indexOf(b.role))
        .map((r) => {
          const u = userData.data!.users.find((u) => u.id === r.userId)!;
          return { id: r.id, user: u, role: r.role, delete: r.id };
        }),
    [roleData]
  );

  const bookRows = useMemo(
    () =>
      roleData
        .data!.roles.filter((r) => bookRoles.includes(r.role))
        .sort((a, b) => bookRoles.indexOf(a.role) - bookRoles.indexOf(b.role))
        .map((r) => {
          const u = userData.data!.users.find((u) => u.id === r.userId)!;
          return { id: r.id, user: u, role: r.role, delete: r.id };
        }),
    [roleData]
  );

  const villageRows = useMemo(
    () =>
      roleData
        .data!.roles.filter((r) => villageRoles.includes(r.role))
        .sort((a, b) => villageRoles.indexOf(a.role) - villageRoles.indexOf(b.role))
        .map((r) => {
          const u = userData.data!.users.find((u) => u.id === r.userId)!;
          return { id: r.id, user: u, role: r.role, village: r.village, delete: r.id };
        }),
    [roleData]
  );

  const villagesOptions = event.villages?.map((v, i) => {
    return (
      <MenuItem key={i} value={v.name}>
        {v.name}
      </MenuItem>
    );
  });

  return (
    <Grid container sx={{ mt: 1 }}>
      <Grid xs={3} p={1} item>
        <FormControl fullWidth>
          <InputLabel id="user-select-label">User</InputLabel>
          <Select labelId="user-select-label" id="user-select" label="User" value={userId} onChange={handleUserChange}>
            {userItems}
          </Select>
        </FormControl>
      </Grid>
      <Grid xs={3} p={1} item>
        <FormControl fullWidth>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select labelId="role-select-label" id="role-select" label="Role" value={role} onChange={handleRoleChange}>
            <MenuItem value="">Choose role</MenuItem>
            <MenuItem value="Owner">Owner</MenuItem>
            <MenuItem value="Manage">Manage</MenuItem>
            <MenuItem value="View">View</MenuItem>
            <MenuItem value="Money">Money</MenuItem>
            <MenuItem value="KP">KP</MenuItem>
            <MenuItem value="Comms">Comms</MenuItem>
            <MenuItem value="Accessibility">Accessibility</MenuItem>
            <MenuItem value="Book">Book</MenuItem>
            <MenuItem value="View - Village">View - Village</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid xs={3} p={1} item>
        <FormControl fullWidth>
          <InputLabel id="villages">Village</InputLabel>
          <Select label="Village" labelId="villages" onChange={handleVillageChange} value={village} disabled={role != "View - Village"}>
            <MenuItem value="All">All</MenuItem>
            {villagesOptions}
          </Select>
        </FormControl>
      </Grid>
      <Grid xs={3} p={1} item>
        <Button disabled={userId === "" || role === "" || createRole.isPending || (role === "View - Village" && village === "All")} variant="contained" sx={{ mt: 0.8 }} size="large" onClick={submit}>
          Add Role
        </Button>
      </Grid>
      <Grid xs={12} p={1} item>
        <DataGrid rowSelection={false} pageSizeOptions={[100]} rows={manageRows} columns={columns} />
      </Grid>
      <Grid xs={12} p={1} item>
        <DataGrid rowSelection={false} pageSizeOptions={[100]} rows={villageRows} columns={villageColumns} />
      </Grid>
      <Grid xs={12} p={1} item>
        <DataGrid rowSelection={false} pageSizeOptions={[100]} rows={bookRows} columns={columns} />
      </Grid>
    </Grid>
  );
}

const renderUserCell = (props) => {
  const { value: u } = props;
  if (u === undefined) return <Typography>User not found</Typography>;
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={1}>
      <WoodcraftAvatar user={u} />
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography>
          {u.userName} ({u.email})
        </Typography>
      </Box>
    </Stack>
  );
};

const renderDeleteCell = (deleteRole, mutation) => (props) => {
  return (
    <IconButton disabled={mutation.isPending} onClick={deleteRole(props.value)} color="warning">
      <Close />
    </IconButton>
  );
};

const userSortComparator = (a, b) => {
  return a.userName.localeCompare(b.userName);
};

const WoodcraftAvatar: React.FC<{ user: JsonUserType }> = (props) => {
  const { user } = props;

  const badgeLetter = user.source.charAt(0).toUpperCase();

  let logoSrc = "/nope.jpg";
  if (user.isWoodcraft) {
    logoSrc = "/logo-avatar.png";
  } else if (user.source === "google") {
    logoSrc = "/google-logo.png";
  } else if (user.source === "apple") {
    logoSrc = "/apple-logo.png";
  } else if (user.source === "yahoo") {
    logoSrc = "/yahoo-logo.png";
  } else if (user.source === "microsoft") {
    logoSrc = "/microsoft-logo.png";
  }

  return <Badge
      overlap="circular"
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      badgeContent={<Avatar alt="Account source" src={logoSrc} sx={{ width: 16, height: 16, border: "2px solid #fff" }} />}
    >
      <Avatar imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 26, height: 26, boxShadow: 5 }} alt={user.userName || ""} src={user.picture || "/nope.jpg"} />
    </Badge>
};
