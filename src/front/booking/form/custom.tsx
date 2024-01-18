import { Box, FormControl, FormControlLabel, FormGroup, FormLabel, Grid, Radio, RadioGroup, TextField, Typography } from "@mui/material"
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js"
import React from "react"
import e from "express"
import { getMemoUpdateFunctions } from "../../../shared/util.js"

function customQuestionFields({ eventCustomQuestions, data = [], update }: { eventCustomQuestions: JsonEventType["customQuestions"], data: Partial<JsonBookingType>["customQuestions"], update: any }) {

    if(!eventCustomQuestions || eventCustomQuestions.length === 0) return null

    const { setArrayItem, setArrayRadio } = getMemoUpdateFunctions(update('customQuestions'))

    const questions = eventCustomQuestions.map((e, i) => {
        switch (e.questionType) {
            case "text":
                return <CustomQestionText key={i} i={i} question={e} data={data ? data[i] ?? '' : ''} setArrayItem={setArrayItem} />
            case "yesnochoice":
                return <CustomQuestionYesNo key={i} i={i} question={e} data={data ? data[i] ?? '' : ''} setArrayRadio={setArrayRadio} />
        }
    })


    return <>
        <Typography variant="h6" sx={{ mt: 2 }}>Other Stuff</Typography>
        {questions}
    </>
}

function CustomQestionText({ i, question, data, setArrayItem }: { i: number, question: JsonEventType["customQuestions"][0], data: any, setArrayItem: any }) {
    const update = setArrayItem(i)
    return (<Grid container spacing={2} mt={1} mb={1}>
        <Grid item xs>
            <TextField fullWidth required id="outlined-required" label={question.questionLabel} value={data || ''} onChange={update} />
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

export const MemoCustomQuestionFields = React.memo(customQuestionFields)