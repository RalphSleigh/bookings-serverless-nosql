import { useContext } from "react"
import { UserContext } from "./userContext.js"
import { Avatar, Button, IconButton, Link, Typography } from "@mui/material"
import React from "react"
import { Link as RouterLink } from 'react-router-dom'
import { Logout } from '@mui/icons-material';

export function UserStatus(props) {
    const user = useContext(UserContext)
    if (user) {
        return <>
            <Typography variant="body1">{user.userName}</Typography>
            <Avatar imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 28, height: 28, ml: 1, boxShadow: 20 }} alt={user.userName} src={user.picture || undefined} />
            <IconButton sx={{ ml: 1 }} component={'a'} href="/api/user/logout" color="inherit">
                <Logout />
            </IconButton>
        </>
    } else {
        return <Button component={RouterLink} to="/login" color="inherit">Login</Button>
    }
}