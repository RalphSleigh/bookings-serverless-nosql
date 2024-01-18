import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { allUsersQueryType, eventRolesQueryType, allUsersQuery, eventRolesQuery, useCreateRole, useDeleteRole } from "../queries.js";
import { managePageContext } from "./managePage.js";
import { useQueries } from "@tanstack/react-query";
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { Avatar, Badge, Box, Button, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField, Typography, useTheme } from "@mui/material";
import { Close } from "@mui/icons-material";
import { JsonUserType } from "../../lambda-common/onetable.js";

export function Component() {
    const { event, bookings } = useOutletContext<managePageContext>()
    const [userData, roleData] = useQueries<[allUsersQueryType, eventRolesQueryType]>({ queries: [allUsersQuery(event.id), eventRolesQuery(event.id)] })

    const [userId, setUserId] = useState<string>("")
    const [role, setRole] = useState<string>("")

    const createRole = useCreateRole(event.id)
    const deleteRole = useDeleteRole(event.id)

    const handleUserChange = (event: SelectChangeEvent) => {
        setUserId(event.target.value as string);
    };

    const handleRoleChange = (event: SelectChangeEvent) => {
        setRole(event.target.value as string);
    };

    const submit = e => {
        createRole.mutate({ eventId: event.id, userId, role })
        e.preventDefault()
    }

    const deleteRoleHandler = roleId => e => {
        deleteRole.mutate(roleId)
        e.preventDefault()
    }

    const userItems = userData.data?.users.map(u => {
        return <MenuItem key={u.id} value={u.id}>
            <Stack direction="row" spacing={1}>
                <WoodcraftAvatar user={u} />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>{u.userName}</Typography>
                </Box>
            </Stack>
        </MenuItem>
    })

    const columns: GridColDef[] = [
        { field: 'user', headerName: 'User', flex: 10, sortComparator: userSortComparator, renderCell: renderUserCell },
        { field: 'role', headerName: 'Role', flex: 5 },
        { field: 'delete', headerName: 'Remove', renderCell: renderDeleteCell(deleteRoleHandler, deleteRole) }
    ];

    const rows = useMemo(() => roleData.data!.roles.map(r => {
        const u = userData.data!.users.find(u => u.id === r.userId)!
        return { id: r.id, user: u, role: r.role, delete: r.id }
    }), [roleData])

    return <Grid container sx={{ mt: 1 }}>
        <Grid xs={4} p={1} item>
            <FormControl fullWidth>
                <InputLabel id="user-select-label">User</InputLabel>
                <Select
                    labelId="user-select-label"
                    id="user-select"
                    label="User"
                    value={userId}
                    onChange={handleUserChange}>
                    {userItems}
                </Select>
            </FormControl>
        </Grid>
        <Grid xs={4} p={1} item>
            <FormControl fullWidth>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                    labelId="role-select-label"
                    id="role-select"
                    label="Role"
                    value={role}
                    onChange={handleRoleChange}>
                    <MenuItem value="">Choose role</MenuItem>
                    <MenuItem value="manage">Manage</MenuItem>
                    <MenuItem value="kp">KP</MenuItem>
                    <MenuItem value="view">View</MenuItem>
                </Select>
            </FormControl>
        </Grid>
        <Grid xs={4} p={1} item>
            <Button disabled={userId === "" || role === "" || createRole.isLoading} variant="contained" sx={{ mt: 0.8 }} size="large" onClick={submit}>Add Role</Button>
        </Grid>
        <Grid xs={12} p={1} item>
            <DataGrid rowSelection={false} pageSizeOptions={[100]} rows={rows} columns={columns} />
        </Grid>
    </Grid>
}

const renderUserCell = props => {
    const { value: u } = props
    if (u === undefined) return <Typography>User not found</Typography>
    const theme = useTheme()
    return <Stack direction="row" spacing={1}>
        <WoodcraftAvatar user={u} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography>{u.userName}</Typography>
        </Box>
    </Stack>
}

const renderDeleteCell = (deleteRole, mutation) => props => {
    return <IconButton disabled={mutation.isLoading} onClick={deleteRole(props.value)} color="warning">
        <Close />
    </IconButton>
}

const userSortComparator = (a, b) => {
    return a.userName.localeCompare(b.userName)
}

const WoodcraftAvatar: React.FC<{user: JsonUserType}>  = props => {
    const { user } = props
    return (user.isWoodcraft ?
        <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
                <Avatar alt="Woodcraft Account" src="/logo-avatar.png" sx={{ width: 16, height: 16, border: "2px solid #fff" }} />
            }
        >
            <Avatar imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 26, height: 26, boxShadow: 5 }} alt={user.userName || ""} src={user.picture || "/nope.jpg"} />
        </Badge>
        :
        <Avatar imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 26, height: 26, boxShadow: 5 }} alt={user.userName || ""} src={user.picture || "/nope.jpg"} />)
}