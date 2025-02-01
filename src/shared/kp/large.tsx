import React from "react";
import { KpStructure, kpValidationResults } from "./kp_class.js";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { Alert, AlertTitle, Checkbox, FormControl, FormControlLabel, FormGroup, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField, Tooltip, Typography } from "@mui/material";
import { capitalizeWord, getMemoUpdateFunctions } from "../util.js";
import { HelpOutline } from '@mui/icons-material';

export class Large implements KpStructure {
    kpName = "Large"
    ParticipantFormElement({ index, data = {}, update, readOnly }: { index: number, data: Partial<Required<JsonParticipantType>["kp"]>, update: any, readOnly: boolean }) {


        const { updateField, updateSwitch } = getMemoUpdateFunctions(update)

        const updateDietSelect = (e) => {
            update(data => ({ ...(data || {}), 'diet': e.target.value, pork: e.target.value !== "omnivore", dairy: !!data?.dairy || e.target.value == "vegan", egg: !!data?.egg || e.target.value == "vegan" }))
            e.preventDefault()
        }

        const kpOptions = KpStructure.dietOptions.map(d => <MenuItem key={d} value={d}>
            {capitalizeWord(d)}
        </MenuItem>)

        return <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item sm={8} xs={12}>
                <Typography variant="body1">Choose the diet you want on camp. Only choose omnivore if you want to eat meat on camp.
                    Camp is a great time to try out a vegetarian diet.
                </Typography>
            </Grid>
            <Grid item sm={4} xs={12}>
                <FormControl required fullWidth>
                    <InputLabel id="diet-select-label">Diet</InputLabel>
                    <Select fullWidth value={data.diet || "default"} label="Diet" required onChange={updateDietSelect} labelId="diet-select-label" disabled={readOnly}>
                        {data.diet ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                        {kpOptions}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <Typography variant="subtitle1"><strong>Dietary Requirements:</strong> Please include any known allergies even if the diet you have selected would exclude them:</Typography>
                <Grid container>
                    <Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.nuts || false} onChange={updateSwitch('nuts')} control={<Checkbox />} label="Nut Free" disabled={readOnly}/>
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.gluten || false} onChange={updateSwitch('gluten')} control={<Checkbox />} label="Gluten Free" disabled={readOnly}/>
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.soya || false} onChange={updateSwitch('soya')} control={<Checkbox />} label="Soya Free" disabled={readOnly}/>
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.dairy || false} onChange={updateSwitch('dairy')} disabled={data.diet == "vegan" || readOnly} control={<Checkbox />} label="Dairy/Lactose Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.egg || false} onChange={updateSwitch('egg')} disabled={data.diet == "vegan" || readOnly} control={<Checkbox />} label="Egg Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.pork || false} onChange={updateSwitch('pork')} disabled={(data.diet && data.diet !== "omnivore") || readOnly} control={<Checkbox />} label="Pork Free" />
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.chickpea || false} onChange={updateSwitch('chickpea')} control={<Checkbox />} label="Chickpea Free" disabled={readOnly}/>
                    </Grid><Grid item xs={12} sm={6} md={4} xl={3}>
                        <FormControlLabel checked={data.diabetic || false} onChange={updateSwitch('diabetic')} control={<Checkbox />} label="Diabetic" disabled={readOnly}/>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    autoComplete={`section-${index}-participant diet-restrictions`}
                    multiline
                    fullWidth
                    minRows={2}
                    name={`${index}-participant-diet-restrictions`}
                    id={`${index}-participant-restrictions`}
                    inputProps={{ 'data-form-type': 'other' }}
                    label="Any other dietary restrictions, allergies, intolerances, elimination diets and diet related medical conditions:"
                    placeholder={`This is your everything else sion for things that didn’t fit into the tick boxes above. (leave blank if not applicable)`}
                    value={data.details || ''}
                    onChange={updateField('details')} 
                    disabled={readOnly}/>
            </Grid>
            {["none", "n/a", "no", "nope"].includes(data.details?.trim().toLocaleLowerCase() || "") ? <Grid item xs={12}>
                <Alert severity="warning" sx={{ mt: 2, pt: 2 }}>
                    <AlertTitle>Please leave this blank if you have nothing to add here</AlertTitle>
                </Alert>
            </Grid> : null}
            <Grid item xs={12}>
                <FormControlLabel checked={data.contactMe || false} onChange={updateSwitch('contactMe')} control={<Checkbox />} label="My allergies or dietary needs are complicated and I would like to be contacted by the camp team" disabled={readOnly}/>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    autoComplete={`section-${index}-participant diet-preferences`}
                    multiline
                    fullWidth
                    minRows={2}
                    name={`${index}-participant-diet-preferences`}
                    id={`${index}-participant-diet-preferences`}
                    inputProps={{ 'data-form-type': 'other' }}
                    label={`Food dislikes/preferences:`}
                    placeholder={`e.g. "I really hate mushrooms" (leave blank if not applicable)`}
                    value={data.preferences || ''}
                    onChange={updateField('preferences')}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">
                            <Tooltip title={`Please only include dislikes and preferences that are important to you, e.g. "I really hate mushrooms". Leave blank if not applicable.`}>
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
                    disabled={readOnly}
                />
            </Grid>
            {["none", "n/a", "no", "nope"].includes(data.preferences?.trim().toLocaleLowerCase() || "") ? <Grid item xs={12}>
                <Alert severity="warning" sx={{ mt: 2, pt: 2 }}>
                    <AlertTitle>Please leave this blank if you have nothing to add here</AlertTitle>
                </Alert>
            </Grid> : null}
        </Grid >
    }

    public validate(participant: Partial<JsonParticipantType>): kpValidationResults {
        const results: kpValidationResults = []
        if (participant.basic?.name) {
            if (!participant.kp?.diet) results.push(`Please select a diet for ${participant.basic?.name}`)
        }
        return results
    }

    PaticipantCardElement({ data }) {

        if (!data) return null

        const noWrap = { whiteSpace: 'nowrap' as 'nowrap', mt: 1 }

        const no = [[data.dairy, "Dairy"],
        [data.soya, "Soya"],
        [data.egg, "Egg"],
        [data.gluten, "Gluten"],
        [data.pork, "Pork"],
        [data.nuts, "Nuts"],
        [data.chickpea, "Chickpea"]].filter(i => i[0]).map(i => i[1]).join(", ")

        return <>
            <Typography variant="body1" sx={noWrap}><b>Diet: </b>{capitalizeWord(data.diet)}</Typography>
            {isNonEmptyString(data.details) ? <Typography variant="body1" sx={{ mt: 2 }}><b>Additional&nbsp;Dietary&nbsp;Requirements:</b><br />{data.details}</Typography> : null}
            {isNonEmptyString(data.preferences) ? <Typography variant="body1" sx={{ mt: 2 }}><b>Food&nbsp;Dislikes/Preferences:</b><br />{data.preferences}</Typography> : null}
            {no ? <Typography variant="body1" sx={{ mt: 2 }}><b>No:</b><br />{no}</Typography> : null}
            {data.diabetic ? <Typography variant="body1" sx={{ mt: 2 }}><strong>Diabetic</strong></Typography> : null}
            {data.contactMe ? <Typography variant="body1" sx={{ mt: 2 }}><strong>Needs are compleectx, please contact me</strong></Typography> : null}
        </>
    }
}

const isNonEmptyString = (str: string | undefined): boolean => str !== undefined && str !== ""