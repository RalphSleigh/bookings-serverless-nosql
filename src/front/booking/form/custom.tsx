import { Box, FormControl, FormControlLabel, FormGroup, FormLabel, Grid, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from "@mui/material"
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js"
import React from "react"
import e from "express"
import { getMemoUpdateFunctions } from "../../../shared/util.js"
import { PartialDeep } from "type-fest"

function customQuestionFields({ event, data = [], basic, camping, update, readOnly }: { event: JsonEventType, data: PartialDeep<JsonBookingType>["customQuestions"], basic: PartialDeep<JsonBookingType>["basic"], camping: PartialDeep<JsonBookingType>["camping"],update: any, readOnly: boolean }) {

    if ((!event.customQuestions || event.customQuestions.length === 0) && !event.howDidYouHear) return null

    const { setArrayItem, setArrayRadio } = getMemoUpdateFunctions(update('customQuestions'))

    const questions = event.customQuestions.map((e, i) => {
        switch (e.questionType) {
            case "text":
                return <CustomQestionText key={i} i={i} question={e} data={data ? data[i] ?? '' : ''} setArrayItem={setArrayItem} readOnly={readOnly}/>
            case "longtext":
                return <CustomQestionLongText key={i} i={i} question={e} data={data ? data[i] ?? '' : ''} setArrayItem={setArrayItem} readOnly={readOnly}/>
            case "yesnochoice":
                return <CustomQuestionYesNo key={i} i={i} question={e} data={data ? data[i] ?? '' : ''} setArrayRadio={setArrayRadio} readOnly={readOnly}/>
        }
    })

    return <>
        <Typography variant="h6" sx={{ mt: 2 }}>Other Stuff</Typography>
        {questions}
        {event.howDidYouHear ? <HowDidYouHear data={basic} update={update} readOnly={readOnly}/> : null}
        {event.bigCampMode ? <TravelQuestion data={camping} update={update} readOnly={readOnly}/> : null}
    </>
}

function CustomQestionText({ i, question, data, setArrayItem, readOnly }: { i: number, question: JsonEventType["customQuestions"][0], data: any, setArrayItem: any, readOnly: boolean }) {
    const update = setArrayItem(i)
    return (<Grid container spacing={2} mt={1} mb={1}>
        <Grid item xs>
            <TextField autoComplete={`section-customquestion-${i} answer`} name={`customquestion-${i}`} id={`customquestion-${i}`} inputProps={{'data-form-type': 'other'}} fullWidth label={question.questionLabel} value={data || ''} onChange={update} disabled={readOnly}/>
        </Grid>
    </Grid>)
}

function CustomQestionLongText({ i, question, data, setArrayItem, readOnly }: { i: number, question: JsonEventType["customQuestions"][0], data: any, setArrayItem: any, readOnly: boolean }) {
    const update = setArrayItem(i)
    return (<Grid container spacing={2} mt={1} mb={1}>
        <Grid item xs>
            <TextField autoComplete={`section-customquestion-${i} answer`} name={`customquestion=${i}`} id={`customquestion-${i}`} inputProps={{'data-form-type': 'other'}} multiline minRows={3} fullWidth label={question.questionLabel} value={data || ''} onChange={update} disabled={readOnly}/>
        </Grid>
    </Grid>)
}

function CustomQuestionYesNo({ i, question, data, setArrayRadio, readOnly }: { i: number, question: JsonEventType["customQuestions"][0], data: any, setArrayRadio: any, readOnly: boolean }) {
    const update = setArrayRadio(i)

    const updateRadio = e => {
        update(e.target.value === "yes" ? true : e.target.value === "no" ? false : undefined)
        e.preventDefault()
    }

    // Radio size="small" does not work
    return (<Grid container spacing={2}>
        <Grid item xs>
            <Box pt={1}>
                <FormLabel id={`custom-question-${i}-label`} radioGroup={`custom-question-${i}-name`}>{question.questionLabel}</FormLabel>
            </Box>
        </Grid><Grid item>
            <RadioGroup
                row
                aria-labelledby={`custom-question-${i}-label`}
                name={`custom-question-${i}-name`}
                value={data === true ? "yes" : data === false ? "no" : ""}
                onChange={updateRadio}>
                <FormControlLabel value="yes" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="Yes" disabled={readOnly}/>
                <FormControlLabel value="no" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="No" disabled={readOnly}/>
            </RadioGroup>
        </Grid>
    </Grid>)
}

function HowDidYouHear({ data, update, readOnly }: { data: PartialDeep<JsonBookingType>["basic"], update: any, readOnly: boolean }) {
    const { updateField } = getMemoUpdateFunctions(update('basic'))

    return <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="how-heaer-select-label">How did you find out about Camp 100?</InputLabel>
        <Select value={data?.howDidYouHear || "default"} label="How did you find out about Camp 100?" required onChange={updateField("howDidYouHear")} labelId="how-heaer-select-label" disabled={readOnly}>
            {data?.howDidYouHear ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
            <MenuItem value="Social Media Post">Social Media Post</MenuItem>
            <MenuItem value="Website">Website</MenuItem>
            <MenuItem value="Word of Mouth">Word of Mouth</MenuItem>
            <MenuItem value="Newsletter">Newsletter</MenuItem>
            <MenuItem value="In the Press">In the Press</MenuItem>
            <MenuItem value="Leaflet">Leaflet</MenuItem>
            <MenuItem value="At Another Event">At Another Event</MenuItem>
        </Select>
    </FormControl>
}

function TravelQuestion({ data, update, readOnly }: { data: PartialDeep<JsonBookingType>["camping"], update: any, readOnly: boolean }) {
    const { updateField } = getMemoUpdateFunctions(update('camping'))

    return <Grid container spacing={2} mt={1} mb={1}>
    <Grid item xs>
        <TextField autoComplete={`section-travel answer`} name={`section-travel-answer`} id={`section-travel-answer`} inputProps={{'data-form-type': 'other'}} label={"Do you know how you will travel to camp? Will you need to use the shuttle bus?"} multiline minRows={3} fullWidth value={data?.travel || ''} onChange={updateField("travel")} placeholder="The shuttle bus will be available (with pre-booking) on the first and last day of camp between Kelmarsh and local train station. The sooner we know who would like to use the shuttle bus, the better." disabled={readOnly}/>
    </Grid>
</Grid>
}

export const MemoCustomQuestionFields = React.memo(customQuestionFields)
