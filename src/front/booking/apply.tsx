import React, { useCallback, useContext, useState } from "react";
import { useCreateApplication, useEvents } from "../queries.js";
import { Navigate, useParams } from "react-router-dom";
import { BookingForm } from "./form/form.js";
import { EnsureHasPermission } from "../permissions.js";
import { CanBookIntoEvent } from "../../shared/permissions.js";
import { BookingType, JsonApplicationType, JsonBookingType, JsonEventType, JsonUserResponseType, UserResponseType } from "../../lambda-common/onetable.js";
import { SnackBarContext, SnackbarDataType } from "../app/toasts.js";
import { PartialDeep } from "type-fest";
import { Box, Button, Card, CardContent, Checkbox, Grid, Skeleton, TextField, Typography, useTheme } from "@mui/material";
import { getMemoUpdateFunctions } from "../../shared/util.js";
import { BorderColor, Send } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";

export function CreateApplicationPage({ event, user }: { event: JsonEventType, user: JsonUserResponseType }) {
    const createApplication = useCreateApplication(event)
    const [applicationData, setApplicationData] = useState<PartialDeep<JsonApplicationType>>({ eventId: event.id, name: user!.userName, email: user?.email })
    const setSnackbar = useContext(SnackBarContext)

    const { updateField, updateNumber } = getMemoUpdateFunctions(setApplicationData)

    const submit = useCallback(() => {
        setApplicationData(data => {
            console.log(data)
            createApplication.mutate(data as JsonApplicationType)
            return data
        })
    }, [])

    const selectedStyle = { borderColor: "success.dark", backgroundColor: "success.light", color: "success.contrastText", cursor: "pointer" }
    const unselectedStyle = { borderColor: "divider.main", backgroundColor: "background.default", cursor: "pointer" }

    const groupStyle = applicationData.bookingType == "group" ? selectedStyle : unselectedStyle
    const individualStyle = applicationData.bookingType == "individual" ? selectedStyle : unselectedStyle

    return <Grid container spacing={2} p={2} justifyContent="center">
        <Grid xl={6} lg={7} md={8} sm={9} xs={12} item>
            <Box>
                <Grid container spacing={2} p={2} justifyContent="center">
                    <Grid xs={12} item>
                        <Typography variant="h5">{`Apply to book for ${event.name}`}</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>We require everyone booking to first go through an application step to help with the booking admin. Once you have submitted this our team will review it and if approved you will be emailed a confirmation and can then come back and fill in the booking form. We may alternativly ask you to get in contact with someone who is already doing booking for your group/area.</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>Please select the type of booking you would like to make:</Typography>
                    </Grid>
                    <Grid xs={6} item>
                        <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...groupStyle }} onClick={() => setApplicationData(data => { return { ...data, bookingType: 'group' } })}>
                            <CardContent>
                                <Checkbox checked={applicationData?.bookingType == "group"} sx={{ float: 'right', mt: -1, mr: -1 }} />
                                <Typography variant="h5">Group Booking</Typography>
                                <Typography variant="body1">If you are booking for a Woodcraft Folk District, Group, or other large booking, please select this option.</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid xs={6} item>
                        <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...individualStyle }} onClick={() => setApplicationData(data => { return { ...data, bookingType: 'individual' } })}>
                            <CardContent>
                                <Checkbox checked={applicationData?.bookingType == "individual"} sx={{ float: 'right', mt: -1, mr: -1 }} />
                                <Typography variant="h5">Individual Booking</Typography>
                                <Typography variant="body1">If you are booking just yourself or your family members, please select this option.</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid xs={12} item>
                        <form>
                            <TextField autoComplete="name" name="name" id="name" inputProps={{'data-form-type': 'name'}} fullWidth sx={{ mt: 2 }} label="Name" value={applicationData.name || ''} onChange={updateField('name')} />
                            <TextField autoComplete="email" name="email" id="email" inputProps={{'data-form-type': 'phone'}} fullWidth sx={{ mt: 2 }} required label="Email" value={applicationData.email || ''} onChange={updateField('email')} />
                            <TextField autoComplete="off" name="group" id="group" inputProps={{'data-form-type': 'other'}} fullWidth sx={{ mt: 2 }} disabled={applicationData.bookingType == "individual"} required label="Group/District" value={applicationData.district || ''} onChange={updateField('district')} />
                            <TextField autoComplete="off" name="predicted" id="predicted" fullWidth inputProps={{ inputMode: "numeric", "data-form-type": "other" }} sx={{ mt: 2 }} required label="Predicted Number of Campers" value={applicationData.predictedParticipants || ''} onChange={updateNumber('predictedParticipants')} />
                            <LoadingButton
                                sx={{ mt: 2 }}
                                onClick={submit}
                                endIcon={<Send />}
                                loading={createApplication.isPending}
                                loadingPosition="end"
                                variant="contained"
                                disabled={!validate(applicationData)}>
                                <span>Submit</span>
                            </LoadingButton>
                        </form>
                    </Grid>
                </Grid>
            </Box>
        </Grid>
    </Grid>
}

const validate = (data: PartialDeep<JsonApplicationType>): boolean => {
    if (!data.bookingType) return false
    if (data.bookingType == "group") {
        if (!data.district || !data.name || !data.email || !data.predictedParticipants) return false
    } else {
        if (!data.name || !data.email || !data.predictedParticipants) return false
    }
    return true
}