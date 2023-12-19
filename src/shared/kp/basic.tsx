import React from "react";
import { KpStructure } from "./kp_class.js";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { getMemoUpdateFunctions } from "../../front/util.js";

export class Basic implements KpStructure {
    kpName = "Basic"
    ParticipantFormElement({ data = {}, update }: { data: Partial<Required<JsonParticipantType>["kp"]>, update: any }) {


        const { updateField, updateSwitch, updateParticipantDate, updateSubField } = getMemoUpdateFunctions(update)

        const capitalizeWord = (word: string) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        };

        const kpOptions = KpStructure.dietOptions.map(d => <MenuItem key={d} value={d}>
            {capitalizeWord(d)}
        </MenuItem>)

        return <>
            <FormControl fullWidth>
                <InputLabel id="diet-select-label">Diet</InputLabel>
                <Select value={data.diet || "default"} label="Diet" required onChange={updateField("diet")} labelId="diet-select-label">
                    {data.diet ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                    {kpOptions}
                </Select>
            </FormControl>
            <TextField sx={{ mt: 2 }} multiline fullWidth minRows={2} id="outlined" label="Any other requirements or allergies?" value={data.details || ''} onChange={updateField('details')} />
        </>
    }
}