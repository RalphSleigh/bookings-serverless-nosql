import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

import { GoogleLoginButton, FacebookLoginButton, MicrosoftLoginButton, YahooLoginButton, AppleLoginButton } from "react-social-login-buttons";

export function LoginPage(props) {

    const navigate = useNavigate()

    return <Grid container spacing={0}>
        <Grid xs item></Grid>
        <Grid p={2} item>
            <Paper elevation={3}>
                <Box p={2}>
                    <Typography variant="body1">Please use one of these providers to log in:</Typography>
                    <GoogleLoginButton onClick={() => window.location.href = "/api/auth/google/redirect"} />
                    {/* <FacebookLoginButton onClick={() => window.location.href = "/api/auth/facebook/redirect"} /> */}
                    <MicrosoftLoginButton onClick={() => window.location.href = "/api/auth/microsoft/redirect"} />
                    <AppleLoginButton onClick={() => window.location.href = "/api/auth/apple/redirect"} />
                    <YahooLoginButton onClick={() => window.location.href = "/api/auth/yahoo/redirect"} />
                    <Typography variant="subtitle2" sx={{ width: 'min-content', minWidth: '100%', textAlign:'center' }}>Facebook is currently unavailable due to increased bureaucracy on their part</Typography>
                </Box>
            </Paper>
        </Grid>
        <Grid xs item></Grid>
    </Grid>
}