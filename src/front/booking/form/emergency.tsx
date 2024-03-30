import { TextField, Typography } from "@mui/material"
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js"
import React from "react"
import { getMemoUpdateFunctions } from "../../../shared/util.js"
import { PartialDeep } from "type-fest"



function emergencyFields({event, data, bookingType, update}: {event: JsonEventType, data: PartialDeep<JsonBookingType>["emergency"], bookingType: JsonBookingType["basic"]["bookingType"], update: any}) {
    if (!event.bigCampMode) {
        return bookingIndvidualEmergencyFields({ data, update })
    } else if (bookingType === "individual") {
        return bookingGroupEmergencyFields({ data, update })
    } else {
        return null
    }
}

function bookingIndvidualEmergencyFields({ data, update }: { data: PartialDeep<JsonBookingType>["emergency"], update: any }) {

    const { updateField } = getMemoUpdateFunctions(update('emergency'))

    return <>
        <Typography variant="h6" sx={{ mt: 2 }}>Emergency</Typography>
        <Typography sx={{ mt: 1 }}>Please provide details of someone we can contact in case of an emergency during the event (a second person is better even if you are not attending yourself)</Typography>
        <TextField autoComplete="off" name="emergency-name" id="emergency-name" inputProps={{'data-form-type': 'other'}} fullWidth sx={{ mt: 2 }} required label="Name" value={data?.name || ''} onChange={updateField('name')} />
        <TextField autoComplete="off" name="emergency-phone" id="emergency-phone" inputProps={{'data-form-type': 'other'}} fullWidth  sx={{ mt: 2 }} required type="tel" label="Phone" value={data?.phone || ''} onChange={updateField('phone')} />
    </>
}

function bookingGroupEmergencyFields({ data, update }: { data: PartialDeep<JsonBookingType>["emergency"], update: any }) {

    const { updateField } = getMemoUpdateFunctions(update('emergency'))

    return <>
        <Typography variant="h6" sx={{ mt: 2 }}>Emergency</Typography>
        <Typography sx={{ mt: 1}}>As you are making an individual booking, please provide some emergency contact details of someone not attending the event.</Typography>
        <TextField autoComplete="off" name="emergency-name" id="emergency-name" inputProps={{'data-form-type': 'other'}} fullWidth sx={{ mt: 2 }} required label="Name" value={data?.name || ''} onChange={updateField('name')} />
        <TextField autoComplete="off" name="emergency-phone" id="emergency-phone" inputProps={{'data-form-type': 'other'}} fullWidth sx={{ mt: 2 }} required type="tel" label="Phone" value={data?.phone || ''} onChange={updateField('phone')} />
    </>
}

export const MemoEmergencyFields = React.memo(emergencyFields)
