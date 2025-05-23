import { TextField, Typography } from "@mui/material"
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js"
import React from "react"
import { getMemoUpdateFunctions } from "../../../shared/util.js"
import { PartialDeep } from "type-fest"



function campingFields({ event, data, update, readOnly }: { event: JsonEventType, data: PartialDeep<JsonBookingType>["camping"], update: any, readOnly: boolean }) {
    if (!event.bigCampMode) {
        return null
    }

    const { updateField } = getMemoUpdateFunctions(update('camping'))
    return <>
        <Typography variant="h6" sx={{ mt: 2 }}>Camping</Typography>
        <TextField autoComplete="campwith" name="campwith" id="campwith" inputProps={{'data-form-type': 'other'}} fullWidth sx={{ mt: 2 }} label="Which other districts or international groups do you want to camp with?" value={data?.campWith || ''} onChange={updateField('campWith')} disabled={readOnly}/>
        <TextField autoComplete="equipment"name="equipment" id="equipment" inputProps={{'data-form-type': 'other'}} multiline fullWidth sx={{ mt: 2 }} label="What camping equipment can you provide?" value={data?.canBringEquipment || ''} onChange={updateField('canBringEquipment')} disabled={readOnly}/>
        <TextField autoComplete="groupaccessibility" name="groupaccessibility" id="groupaccessibility" inputProps={{'data-form-type': 'other'}} multiline fullWidth sx={{ mt: 2 }} label="Details of any accessibility needs for your campers" value={data?.accessibilityNeeds || ''} onChange={updateField('accessibilityNeeds')} placeholder="e.g Do you need an electric connection, ready access to a fridge or to be close to central areas" disabled={readOnly}/>
    </>
}

export const MemoCampingFields = React.memo(campingFields)
