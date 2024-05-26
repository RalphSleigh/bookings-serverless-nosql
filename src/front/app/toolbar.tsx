import { Brightness4, Brightness7, BugReport } from "@mui/icons-material";
import { AppBar, Box, Button, IconButton, Link, Toolbar, Typography, createTheme, useTheme } from "@mui/material";
import React, { useContext } from "react";
import { ThemeContext } from "./themeContext.js";
import { UserStatus } from "../user/userStatus.js";
import { EnvContext } from "./envContext.js";
import { ThemeProvider } from "@emotion/react";

export function AppToolbar(props) {
    const globalTheme = useTheme()
    const colourMode = useContext(ThemeContext)
    const env = useContext(EnvContext)
    const [error, setError] = React.useState(false);

    if (error) throw ("BOOM (render)")
    const theme = createTheme({
            palette: {
                primary: {
                    main: "#e9e1ca",
                    contrastText: 'rgba(0,0,0,0.7)',
                }
          }
        })
    return (<ThemeProvider theme={globalTheme.palette.mode == "light" ? theme : globalTheme}>
        <AppBar position="static">
        <Toolbar variant="dense">
                <Box
                    component="img"
                    sx={{
                        height: 40,
                        ml: -2.5,
                        mr: 1
                    }}
                    alt="Logo"
                    src="/header-wordmark.png"
                />
                <Link sx={{ flexShrink: 1, minWidth: 0, overflow: 'hidden' }} noWrap={true} underline="hover" variant="h6" color="inherit" href="/">
                    {window.location.hostname}
                </Link>
            <Box sx={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }} />
            <UserStatus />
            <IconButton sx={{ ml: 1 }} onClick={colourMode.toggleColorMode} color="inherit">
                {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            {env.env === "dev" ? <><IconButton sx={{ ml: 1 }} onClick={() => { throw ("BOOM (event handler)") }} color="inherit">
                <BugReport color="warning" />
            </IconButton>
                <IconButton sx={{ ml: 1 }} onClick={() => { setError(true) }} color="inherit">
                    <BugReport color="warning" />
                </IconButton>
                <Typography variant="h6" sx={{ ml: 1, color: "warning.main" }}>TEST MODE</Typography>
            </> : null}
        </Toolbar>
    </AppBar >
    </ThemeProvider>)
}