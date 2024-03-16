import React from "react";
import { KpStructure, kpValidationResults } from "./kp_class.js";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { Checkbox, FormControl, FormControlLabel, FormGroup, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField, Tooltip, Typography } from "@mui/material";
import { getMemoUpdateFunctions } from "../util.js";
import { HelpOutline } from '@mui/icons-material';

export class Large implements KpStructure {
    kpName = "Large"
    ParticipantFormElement({ data = {}, update }: { data: Partial<Required<JsonParticipantType>["kp"]>, update: any }) {


        const { updateField, updateSwitch } = getMemoUpdateFunctions(update)

        const capitalizeWord = (word: string) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        };

        const kpOptions = KpStructure.dietOptions.map(d => <MenuItem key={d} value={d}>
            {capitalizeWord(d)}
        </MenuItem>)

        return <Grid container spacing={2} sx={{mt:1}}>
            <Grid item sm={8} xs={12}>
                <Typography variant="body1">Choose the diet you want on camp. Only choose Omni if you want to eat meat on camp.
                    Camp is a great time to try out a veggy diet.
                </Typography>
            </Grid>
            <Grid item sm={4} xs={12}>
                <FormControl required fullWidth>
                    <InputLabel id="diet-select-label">Diet</InputLabel>
                    <Select fullWidth value={data.diet || "default"} label="Diet" required onChange={updateField("diet")} labelId="diet-select-label">
                        {data.diet ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                        {kpOptions}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <Typography variant="subtitle1">Simple Dietary Requirements, please select all that apply:</Typography>
                <FormGroup row>
                    <FormControlLabel checked={data.nuts} onChange={updateSwitch('nuts')} control={<Checkbox />} label="Nut Free" />
                    <FormControlLabel checked={data.gluten} onChange={updateSwitch('gluten')} control={<Checkbox />} label="Gluten Free" />
                    <FormControlLabel checked={data.soya} onChange={updateSwitch('soya')} control={<Checkbox />} label="Soya Free" />
                    <FormControlLabel checked={data.dairy} onChange={updateSwitch('dairy')} control={<Checkbox />} label="Dairy/Lactose Free" />
                    <FormControlLabel checked={data.egg} onChange={updateSwitch('egg')} control={<Checkbox />} label="Egg Free" />
                    <FormControlLabel checked={data.pork} onChange={updateSwitch('pork')} disabled={data.diet !== "omnivore"} control={<Checkbox />} label="Pork Free" />
                    <FormControlLabel checked={data.chickpea} onChange={updateSwitch('chickpea')} control={<Checkbox />} label="Chickpea Free" />
                </FormGroup>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    sx={{ mt: 2 }}
                    multiline
                    fullWidth
                    minRows={2}
                    id="outlined"
                    label={`Food dislikes/preferences:`}
                    placeholder={`e.g. "I really hate mushrooms"`}
                    value={data.preferences || ''}
                    onChange={updateField('preferences')}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">
                            <Tooltip title={`Please only include dislikes and preferences that are important to you, e.g. "I really hate mushrooms`}>
                                <IconButton
                                    aria-label="toggle password visibility"
                                    edge="end"
                                >
                                    <HelpOutline />
                                </IconButton>
                            </Tooltip>
                        </InputAdornment>,
                        sx: { alignItems: "flex-start" }
                    }}
                />
            </Grid>
            <Grid item xs={12}>
                <TextField multiline fullWidth minRows={2} id="outlined" label="Any other dietary restrictions, allergies, intolerances or elimination diets:" placeholder={`This is your everything else section for things that didn’t fit into the tick boxes above.`} value={data.details || ''} onChange={updateField('details')} />
            </Grid>
        </Grid >
    }

    public validate(participant: Partial<JsonParticipantType>): kpValidationResults {
        const results: kpValidationResults = []
        if (participant.basic?.name) {
            if (!participant.kp?.diet) results.push(`Please select a diet for ${participant.basic?.name}`)
        }
        return results
    }
}