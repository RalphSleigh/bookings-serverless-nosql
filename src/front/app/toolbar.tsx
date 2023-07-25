import { Brightness4, Brightness7 } from "@mui/icons-material";
import { AppBar, Button, IconButton, Link, Toolbar, Typography } from "@mui/material";
import React, { useContext } from "react";
import { ThemeContext } from "./themeContext.js";
import { UserStatus } from "../user/userStatus.js";

export function AppToolbar(props) {
    const theme = useContext(ThemeContext)

    return <AppBar position="static">
        <Toolbar variant="dense">
            <Link underline="hover" variant="h6" color="inherit" sx={{ flexGrow: 1 }} href="/">
                {window.location.hostname}
            </Link>

            <UserStatus />
            <IconButton sx={{ ml: 1 }} onClick={theme.toggleColorMode} color="inherit">
                {theme.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
        </Toolbar>
    </AppBar>
}