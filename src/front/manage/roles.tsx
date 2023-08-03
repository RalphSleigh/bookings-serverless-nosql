import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { allUsersQueryType, eventRolesQueryType, allUsersQuery, eventRolesQuery } from "../queries.js";
import { managePageContext } from "./managePage.js";
import { useQueries } from "@tanstack/react-query";
import { Avatar, Button, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField, Typography } from "@mui/material";

export function Component() {
    const { event, bookings } = useOutletContext<managePageContext>()
    const [userData, roleData] = useQueries<[allUsersQueryType, eventRolesQueryType]>({ queries: [allUsersQuery(event.id), eventRolesQuery(event.id)] })

    const [userId, setUserId] = useState<string>("")
    const [role, setRole] = useState<string>("")

    const handleUserChange = (event: SelectChangeEvent) => {
        setUserId(event.target.value as string);
    };

    const handleRoleChange = (event: SelectChangeEvent) => {
        setRole(event.target.value as string);
    };

    const userItems = userData.data?.users.map(u => <MenuItem key={u.id} value={u.id}>
        <Stack direction="row" spacing={1}>
            <Avatar imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 22, height: 22, boxShadow: 20 }} alt={u.userName} src={u.picture || "/nope.jpg"} />
            <Typography>{u.userName}</Typography>
        </Stack>
    </MenuItem>)

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
                </Select>
            </FormControl>
        </Grid>
        <Grid xs={4} p={1} item>
            <Button disabled={userId === "" || role === ""} variant="contained" sx={{ mt: 0.8 }} size="large">Add Role</Button>
        </Grid>
    </Grid>
}
