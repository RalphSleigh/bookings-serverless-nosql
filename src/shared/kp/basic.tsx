import React from "react";
import { KpStructure } from "./kp_class.js";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export class Basic implements KpStructure {
    kpName = "Basic"
    ParticipantFormElement({ data = {}, update }: { data: Partial<Required<JsonParticipantType>["kp"]>, update: any }) {

        const updateField =  field => e => {
            update(field)(e.target.value)
            e.preventDefault()
        }

        const kpOptions = KpStructure.dietOptions.map(d => <MenuItem key={d} value={d}>
            {d}
        </MenuItem>)

        return <>
            <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="diet-select-label">Diet</InputLabel>
                <Select value={data.diet || "default"} label="Diet" onChange={updateField("diet")} labelId="diet-select-label">
                    {data.diet ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                    {kpOptions}
                </Select>
            </FormControl>
        </>
    }
}