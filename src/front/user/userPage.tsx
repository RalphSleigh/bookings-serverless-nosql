import { Avatar, Box, Button, Grid, Paper, TextField, Typography } from "@mui/material";
import React, { useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { GoogleLoginButton, FacebookLoginButton, MicrosoftLoginButton, YahooLoginButton } from "react-social-login-buttons";
import { UserContext } from "./userContext.js";
import { useEditUser } from "../queries.js";
import { getMemoUpdateFunctions } from "../../shared/util.js";

export function UserPage(props) {

    const navigate = useNavigate()
    const user = useContext(UserContext)!
    const [userDetails, setUserDetails] = React.useState(user)

    const { updateField } = getMemoUpdateFunctions(setUserDetails)
    const editUser = useEditUser()

    const saveUser = e => {
        editUser.mutate(userDetails)
        e.preventDefault()
    }

    if (editUser.isSuccess) {
        return <Navigate to='/' />
    }

    return <Grid container spacing={0}>
        <Grid xs item></Grid>
        <Grid p={2} item>
            <Paper elevation={3}>
                <Box p={2}>
                <Avatar imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 28, height: 28, ml: 1, boxShadow: 20, float: "right" }} alt={user?.userName ?? undefined} src={user.picture || "/nope.jpg"} />
                    <Typography variant="h6">Account details</Typography>
                    <Typography variant="body1">You are logged in via {user?.source}</Typography>
                    {user.isWoodcraft ? <Typography variant="body1">You can't edit these are they are set by the Woodcraft Folk directory</Typography> : <Typography variant="body1">You can update your details here:</Typography>}
                    <form>
                        <TextField fullWidth disabled={user.isWoodcraft} sx={{ mt: 2 }} id="outlined" label="Display Name" value={userDetails.userName} onChange={updateField("userName")} />
                        <TextField fullWidth disabled={user.isWoodcraft} sx={{ mt: 2 }} id="outlined" label="Email" value={userDetails.email} onChange={updateField("email")} />
                        <Button sx={{ mt: 2 }} variant="contained" onClick={saveUser}>Save</Button>
                    </form>
                </Box>
            </Paper>
        </Grid>
        <Grid xs item></Grid>
    </Grid>
}