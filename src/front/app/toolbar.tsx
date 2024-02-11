import { Brightness4, Brightness7, BugReport } from "@mui/icons-material";
import { AppBar, Box, Button, IconButton, Link, Toolbar, Typography, useTheme } from "@mui/material";
import React, { useContext } from "react";
import { ThemeContext } from "./themeContext.js";
import { UserStatus } from "../user/userStatus.js";
import { EnvContext } from "./envContext.js";

export function AppToolbar(props) {
    const theme = useTheme();
    const colourMode = useContext(ThemeContext)
    const env = useContext(EnvContext)
    const [error, setError] = React.useState(false);

    if(error) throw("BOOM (render)")

    return (<AppBar position="static">
        <Toolbar variant="dense">
            <Box
                component="img"
                sx={{
                    height: 40,
                    ml: -2.5,
                    mr: 1
                }}
                alt="Logo"
                src="/logoonly.png"
            />
            <Link underline="hover" variant="h6" color="inherit" sx={{ flexGrow: 1, }} href="/">
                {window.location.hostname}
            </Link>

            <UserStatus />
            <IconButton sx={{ ml: 1 }} onClick={colourMode.toggleColorMode} color="inherit">
                {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            {env === "dev" ? <><IconButton sx={{ ml: 1 }} onClick={() => { throw("BOOM (event handler)") }} color="inherit">
                <BugReport color="warning" />
            </IconButton>
            <IconButton sx={{ ml: 1 }} onClick={() => { setError(true) }} color="inherit">
                <BugReport color="warning"/>
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1, color: "warning.main" }}>TEST MODE</Typography>
            </> : null}
        </Toolbar>
    </AppBar>)
}