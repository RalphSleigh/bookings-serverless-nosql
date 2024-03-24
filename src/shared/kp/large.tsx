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

        const updateDietSelect = (e) => {
            update(data => ({ ...data, 'diet': e.target.value, pork: e.target.value !== "omnivore", dairy: data.dairy || e.target.value == "vegan", egg: data.egg || e.target.value == "vegan" }))
            e.preventDefault()
        }

        const kpOptions = KpStructure.dietOptions.map(d => <MenuItem key={d} value={d}>
            {capitalizeWord(d)}
        </MenuItem>)

        return <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item sm={8} xs={12}>
                <Typography variant="body1">Choose the diet you want on camp. Only choose Omni if you want to eat meat on camp.
                    Camp is a great time to try out a veggy diet.
                </Typography>
            </Grid>
            <Grid item sm={4} xs={12}>
                <FormControl required fullWidth>
                    <InputLabel id="diet-select-label">Diet</InputLabel>
                    <Select fullWidth value={data.diet || "default"} label="Diet" required onChange={updateDietSelect} labelId="diet-select-label">
                        {data.diet ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                        {kpOptions}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <Typography variant="subtitle1"><strong>Dietary Requirements:</strong> Please include any known allergies even if the diet you have selected would exclude them:</Typography>
                <Grid container>
                    <Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.nuts || false} onChange={updateSwitch('nuts')} control={<Checkbox />} label="Nut Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.gluten || false} onChange={updateSwitch('gluten')} control={<Checkbox />} label="Gluten Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.soya || false} onChange={updateSwitch('soya')} control={<Checkbox />} label="Soya Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.dairy || false} onChange={updateSwitch('dairy')} disabled={data.diet == "vegan"} control={<Checkbox />} label="Dairy/Lactose Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.egg || false} onChange={updateSwitch('egg')} disabled={data.diet == "vegan"} control={<Checkbox />} label="Egg Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.pork || false} onChange={updateSwitch('pork')} disabled={data.diet && data.diet !== "omnivore"} control={<Checkbox />} label="Pork Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.chickpea || false} onChange={updateSwitch('chickpea')} control={<Checkbox />} label="Chickpea Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.diabetic || false} onChange={updateSwitch('diabetic')} control={<Checkbox />} label="Diabetic" />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <TextField autoComplete="off" multiline fullWidth minRows={2} id="outlined" label="Any other dietary restrictions, allergies, intolerances, elimination diets and diet related medical conditions:" placeholder={`This is your everything else section for things that didn’t fit into the tick boxes above.`} value={data.details || ''} onChange={updateField('details')} />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel checked={data.contactMe} onChange={updateSwitch('contactMe')} control={<Checkbox />} label=" My allergies or dietary needs are complicated and I would like to be contacted by the camp team" />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    autoComplete="off"
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