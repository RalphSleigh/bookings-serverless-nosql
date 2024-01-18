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
            <Link underline="hover" href="/user" color="inherit">
                <Typography variant="body1">{user.userName ?? ''}</Typography>
            </Link>
            <RouterLink to="/user" style={{textDecoration:"none"}}>
                <Avatar imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 28, height: 28, ml: 1, boxShadow: 20 }} alt={user?.userName ?? undefined} src={user.picture || "/nope.jpg"} />
            </RouterLink>
            <IconButton sx={{ ml: 1 }} component={'a'} href="/api/user/logout" color="inherit">
                <Logout />
            </IconButton>
        </>
    } else {
        return <Button component={RouterLink} to="/login" color="inherit">Login</Button>
    }
}