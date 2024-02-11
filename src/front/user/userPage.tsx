import { Avatar, Box, Button, Grid, Paper, TextField, Typography } from "@mui/material";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./userContext.js";
import { useEditUser } from "../queries.js";
import { getMemoUpdateFunctions } from "../../shared/util.js";
import { Link } from "react-router-dom";

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

    return <Grid container spacing={0}>
        <Grid xs item></Grid>
        <Grid p={2} item>
            <Paper elevation={3}>
                <Box p={2}>
                    <Avatar imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 28, height: 28, ml: 1, boxShadow: 20, float: "right" }} alt={user?.userName ?? undefined} src={user.picture || "/nope.jpg"} />
                    <Typography variant="h6">Account details</Typography>
                    <Typography variant="body1">You are logged in via {user?.source}{user.isWoodcraft ? ' with a Woodcraft Folk account' : ''}</Typography>
                    {user.isWoodcraft ? <Typography variant="body1">You can't edit these are they are set by the Woodcraft Folk directory, so probably want to go <Link to="/">Home</Link></Typography> : <Typography variant="body1">You can update your details here:</Typography>}
                    <form>
                        <TextField fullWidth disabled={user.isWoodcraft} sx={{ mt: 2 }} id="outlined" label="Display Name" value={userDetails.userName} onChange={updateField("userName")} />
                        <TextField fullWidth disabled={user.isWoodcraft} sx={{ mt: 2 }} id="outlined" label="Email" value={userDetails.email} onChange={updateField("email")} />
                        <Button disabled={user.isWoodcraft} sx={{ mt: 2 }} variant="contained" onClick={saveUser}>Save</Button>
                    </form>
                </Box>
            </Paper>
        </Grid>
        <Grid xs item></Grid>
    </Grid>
}