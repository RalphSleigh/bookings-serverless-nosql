import { Box, FormControl, FormControlLabel, FormGroup, FormLabel, Grid, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from "@mui/material"
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js"
import React from "react"
import e from "express"
import { getMemoUpdateFunctions } from "../../../shared/util.js"
import { PartialDeep } from "type-fest"

function customQuestionFields({ event, data = [], basic, update }: { event: JsonEventType, data: PartialDeep<JsonBookingType>["customQuestions"], basic: PartialDeep<JsonBookingType>["basic"], update: any }) {

    if ((!event.customQuestions || event.customQuestions.length === 0) && !event.howDidYouHear) return null

    const { setArrayItem, setArrayRadio } = getMemoUpdateFunctions(update('customQuestions'))

    const questions = event.customQuestions.map((e, i) => {
        switch (e.questionType) {
            case "text":
                return <CustomQestionText key={i} i={i} question={e} data={data ? data[i] ?? '' : ''} setArrayItem={setArrayItem} />
            case "longtext":
                return <CustomQestionLongText key={i} i={i} question={e} data={data ? data[i] ?? '' : ''} setArrayItem={setArrayItem} />
            case "yesnochoice":
                return <CustomQuestionYesNo key={i} i={i} question={e} data={data ? data[i] ?? '' : ''} setArrayRadio={setArrayRadio} />
        }
    })

    return <>
        <Typography variant="h6" sx={{ mt: 2 }}>Other Stuff</Typography>
        {questions}
        {event.howDidYouHear ? <HowDidYouHear data={basic} update={update} /> : null}
    </>
}

function CustomQestionText({ i, question, data, setArrayItem }: { i: number, question: JsonEventType["customQuestions"][0], data: any, setArrayItem: any }) {
    const update = setArrayItem(i)
    return (<Grid container spacing={2} mt={1} mb={1}>
        <Grid item xs>
            <TextField autoComplete="off" fullWidth id="outlined-required" label={question.questionLabel} value={data || ''} onChange={update} />
        </Grid>
    </Grid>)
}

function CustomQestionLongText({ i, question, data, setArrayItem }: { i: number, question: JsonEventType["customQuestions"][0], data: any, setArrayItem: any }) {
    const update = setArrayItem(i)
    return (<Grid container spacing={2} mt={1} mb={1}>
        <Grid item xs>
            <TextField autoComplete="off" multiline minRows={3} fullWidth id="outlined-required" label={question.questionLabel} value={data || ''} onChange={update} />
        </Grid>
    </Grid>)
}

function CustomQuestionYesNo({ i, question, data, setArrayRadio }: { i: number, question: JsonEventType["customQuestions"][0], data: any, setArrayRadio: any }) {
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
                <FormControlLabel value="yes" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="Yes" />
                <FormControlLabel value="no" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="No" />
            </RadioGroup>
        </Grid>
    </Grid>)
}

function HowDidYouHear({ data, update }: { data: PartialDeep<JsonBookingType>["basic"], update: any }) {
    const { updateField } = getMemoUpdateFunctions(update('basic'))

    return <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="how-heaer-select-label">How did you find out about Camp 100?</InputLabel>
        <Select value={data?.howDidYouHear || "default"} label="How did you find out about Camp 100?" required onChange={updateField("howDidYouHear")} labelId="how-heaer-select-label">
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

export const MemoCustomQuestionFields = React.memo(customQuestionFields)
