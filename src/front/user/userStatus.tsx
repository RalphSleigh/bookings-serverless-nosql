import { useContext } from "react"
import { UserContext } from "./userContext.js"
import { Button, IconButton, Link, Typography } from "@mui/material"
import React from "react"
import { Link as RouterLink } from 'react-router-dom'
import  { Logout } from '@mui/icons-material';

export function UserStatus(props) {
    const user = useContext(UserContext)
    if(user) {
        return <>
                <Typography variant="body1">{user.userName}</Typography>
                <IconButton sx={{ ml: 1 }} component={'a'} href="/api/user/logout" color="inherit">
                    <Logout/>   
                </IconButton>
            </>
    } else {
        return <Button component={RouterLink} to="/login" color="inherit">Login</Button>
    }
}