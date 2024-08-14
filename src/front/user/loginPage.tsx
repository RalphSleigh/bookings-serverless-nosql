import { Alert, AlertTitle, Box, Button, Grid, Paper, Typography } from "@mui/material";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { GoogleLoginButton, FacebookLoginButton, MicrosoftLoginButton, YahooLoginButton, AppleLoginButton } from "react-social-login-buttons";
import { useStickyState } from "../util.js";

export function LoginPage(props) {

    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams();
    const [existing, setExisting] = useStickyState("", "existingLogin")

    const saveAndRedirect = (provider: string, location: string) => {
        setExisting(provider)
        window.location.href = location
    }

    return <Grid container spacing={0}>
        <Grid xs item></Grid>
        <Grid p={2} item>
            {(searchParams.get('error') == "true") ?
                <Alert severity="error" sx={{ mt: 2, pt: 2, width: 'min-content', minWidth: '100%' }}>
                    <AlertTitle>Error logging in</AlertTitle>
                    <Typography>Please try again and ensure you don't refresh the page or use the back button during the login process.
                    </Typography>
                </Alert> : null}
            <Paper elevation={3}>
                <Box p={2} mt={2}>
                    <Typography variant="body1">Please use one of these providers to log in:</Typography>
                    <GoogleLoginButton style={{opacity: existing === "google" || existing === "" ? 1 : 0.5}} onClick={() => saveAndRedirect("google", "/api/auth/google/redirect")} />
                    {/* <FacebookLoginButton onClick={() => window.location.href = "/api/auth/facebook/redirect"} /> */}
                    <MicrosoftLoginButton style={{opacity: existing === "microsoft" || existing === "" ? 1 : 0.5}}onClick={() => saveAndRedirect("microsoft", "/api/auth/microsoft/redirect")} />
                    <AppleLoginButton style={{opacity: existing === "apple" || existing === "" ? 1 : 0.5}} onClick={() => saveAndRedirect("apple", "/api/auth/apple/redirect")} />
                    <YahooLoginButton style={{opacity: existing === "yahoo" || existing === "" ? 1 : 0.5}} onClick={() => saveAndRedirect("yahoo", "/api/auth/yahoo/redirect")} />
                    <Typography variant="subtitle2" sx={{ width: 'min-content', minWidth: '100%', textAlign: 'center' }}>Facebook is currently unavailable due to increased bureaucracy on their part</Typography>
                </Box>
            </Paper>
        </Grid>
        <Grid xs item></Grid>
    </Grid>
}