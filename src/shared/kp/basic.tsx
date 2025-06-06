import React from "react";
import { KpStructure, kpValidationResults } from "./kp_class.js";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { capitalizeWord, getMemoUpdateFunctions } from "../util.js";

export class Basic implements KpStructure {
    kpName = "Basic"
    ParticipantFormElement({ index, data = {}, update }: { index: number, data: Partial<Required<JsonParticipantType>["kp"]>, update: any }) {


        const { updateField } = getMemoUpdateFunctions(update)

        const kpOptions = KpStructure.dietOptions.map(d => <MenuItem key={d} value={d}>
            {capitalizeWord(d)}
        </MenuItem>)

        return <>
            <FormControl required fullWidth>
                <InputLabel id="diet-select-label">Diet</InputLabel>
                <Select value={data.diet || "default"} label="Diet" required onChange={updateField("diet")} labelId="diet-select-label">
                    {data.diet ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                    {kpOptions}
                </Select>
            </FormControl>
            <TextField sx={{ mt: 2 }} multiline fullWidth minRows={2} id="outlined" label="Additional dietary requirement or food related allergies:" value={data.details || ''} onChange={updateField('details')} />
        </>
    }

    public validate(participant: Partial<JsonParticipantType>): kpValidationResults {
        const results: kpValidationResults = []
        if(participant.basic?.name) {
            if(!KpStructure.dietOptions.includes(participant.kp?.diet || "")) results.push(`Please select a diet for ${participant.basic?.name}`)
        }
        return results
    }

    PaticipantCardElement({data}) {
        if(!data) return null

        const noWrap = { whiteSpace: 'nowrap' as 'nowrap', mt: 1 }

        return <>
        <Typography variant="body1" sx={noWrap}><b>Diet: </b>{capitalizeWord(data.diet)}</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}><b>Additional&nbsp;Dietary&nbsp;Requirements:</b><br />{data.details}</Typography>
        </>
    }
}