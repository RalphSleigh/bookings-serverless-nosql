import { TextField, Typography } from "@mui/material"
import { JsonBookingType } from "../../../lambda-common/onetable.js"
import React from "react"
import { getMemoUpdateFunctions } from "../../../shared/util.js"

function bookingIndvidualEmergencyFields({ data, update }: { data: Partial<JsonBookingType>["emergency"], update: any }) {

    const { updateField } = getMemoUpdateFunctions(update('emergency'))

    return <>
        <Typography variant="h6" sx={{ mt: 2 }}>Emergency</Typography>
        <Typography sx={{ mt: 1 }}>Please provide details of someone we can contact in case of an emergency during the event (a second person is better even if you are not attending yourself)</Typography>
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" label="Name" value={data?.name || ''} onChange={updateField('name')} />
        <TextField fullWidth  sx={{ mt: 2 }} required id="outlined-required" type="tel" label="Phone" value={data?.phone || ''} onChange={updateField('phone')} />
    </>
}

function bookingGroupEmergencyFields({ data, update }: { data: Partial<JsonBookingType>["emergency"], update: any }) {

    const { updateField } = getMemoUpdateFunctions(update('emergency'))

    return <>
        <Typography variant="h6" sx={{ mt: 2 }}>Emergency</Typography>
        <Typography sx={{ mt: 1}}>As you have only booked in one adult, please provide some emergency contact details of someone not attending the event.</Typography>
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" label="Name" value={data?.name || ''} onChange={updateField('name')} />
        <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" type="tel" label="Phone" value={data?.phone || ''} onChange={updateField('phone')} />
    </>
}

export const MemoBookingIndvidualEmergencyFields = React.memo(bookingIndvidualEmergencyFields)
export const MemoBookingGroupEmergenecyFields = React.memo(bookingGroupEmergencyFields)