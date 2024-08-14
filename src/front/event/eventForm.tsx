import { FormGroup, Grid, Paper, TextField, Typography, Box, Button, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel, IconButton } from "@mui/material";
import React, { useCallback, useContext, useState } from "react";
import { UserContext } from "../user/userContext.js";
import { validate } from "./validate.js";
import { UtcDatePicker } from "../util.js";
import { fees, getFee, maybeGetFee } from "../../shared/fee/fee.js";
import { kp } from "../../shared/kp/kp.js"
import { attendances, getAttendance, maybeGetAttendance } from "../../shared/attendance/attendance.js";
import { JsonEventType } from "../../lambda-common/onetable.js";
import { AttendanceStructure } from "../../shared/attendance/attendanceStructure.js";
import { FeeStructure } from "../../shared/fee/feeStructure.js";
import { Close } from "@mui/icons-material";
import { getMemoUpdateFunctions, parseDate } from "../../shared/util.js";
import { DateTimePicker } from '@mui/x-date-pickers'
import { consent } from "../../shared/consents/consent.js";
import { useEvents } from "../queries.js";

export function EventForm({ data: inputData, submit, mode }: { data: any, submit: (data) => void, mode: "create" | "edit" }) {
    const user = useContext(UserContext)
    const [data, setData] = useState<Partial<JsonEventType>>(inputData)

    const { events } = useEvents().data

    const { updateField, updateDate, updateSwitch, updateSubField } = getMemoUpdateFunctions(setData)

    const create = e => {
        submit(data)
        e.preventDefault()
    }

    const kpOptions = Object.entries(kp).map(([key, value]) => <MenuItem key={key} value={key}>
        {value.kpName}
    </MenuItem>)

    const consentOptions = Object.entries(consent).map(([key, value]) => <MenuItem key={key} value={key}>
        {value.consentName}
    </MenuItem>)


    const attendanceOptions = Object.entries(attendances).map(([key, value]) => <MenuItem key={key} value={key}>
        {value.attendanceName}
    </MenuItem>)

    const Attendance = maybeGetAttendance(data)
    const AttendanceConfig = Attendance?.ConfigurationElement ?? (() => <></>)

    const feeOptions = Object.entries(fees).filter(([key, value]) => value.enabledForAttendance(Attendance)).map(([key, value]) => <MenuItem key={key} value={key}>
        {value.feeName}
    </MenuItem>)

    const Fees = maybeGetFee(data)
    const FeeConfig = Fees?.ConfigurationElement ?? (() => <></>)

    const eventsToCopyFrom  = events.map(e => <MenuItem key={e.id} value={e.id}>
        {e.name}
    </MenuItem>)

    const copyFromEvent = e => {
        const event = events.find(event => event.id == e.target.value) as Partial<JsonEventType>
        if(!event) return
        delete event.id
        setData({...event})
    }

    return <Grid container spacing={0}>
        <Grid xs={12} p={2} item>
            <Paper elevation={3}>
                <Box p={2}>
                    <form>
                        <Grid container spacing={0}>
                            <Typography variant="h4">{mode == "create" ? "New Event" : `Editing - ${data.name}`}</Typography>
                            <Grid xs={12} item>
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel id="event-select-label">Copy From</InputLabel>
                                    <Select label="Copy From" onChange={copyFromEvent} labelId="event-select-label">
                                        <MenuItem key="default" value="default">Please select</MenuItem>
                                        {eventsToCopyFrom}
                                    </Select>
                                </FormControl>
                                <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" label="Name" value={data.name || ''} onChange={updateField('name')} />
                                <TextField fullWidth sx={{ mt: 2 }} multiline minRows={3} id="outlined-required" label="Description" value={data.description || ''} onChange={updateField('description')} />
                                <FormGroup>
                                    <UtcDatePicker sx={{ mt: 2 }} label="Start Date" value={data.startDate} onChange={updateDate('startDate')} />
                                </FormGroup>
                                <FormGroup>
                                    <UtcDatePicker sx={{ mt: 2 }} label="End Date" value={data.endDate} onChange={updateDate('endDate')} />
                                </FormGroup>
                                <FormGroup>
                                    <DateTimePicker sx={{ mt: 2 }} label="Booking Deadline" timezone="UTC" value={parseDate(data.bookingDeadline)} onChange={updateDate('bookingDeadline')} />
                                </FormGroup>
                                <TextField fullWidth sx={{ mt: 2 }} required type="email" id="outlined-required" label="Email subject tag" value={data.emailSubjectTag || ''} onChange={updateField('emailSubjectTag')} />
                                <TextField fullWidth sx={{ mt: 2 }} required type="email" id="outlined-required" label="Reply-to" value={data.replyTo || ''} onChange={updateField('replyTo')} />
                                <FormGroup>
                                    <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={data.bigCampMode || false} onChange={updateSwitch('bigCampMode')} />} label="Big Camp Mode" />
                                </FormGroup>
                                <FormGroup>
                                    <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={data.applicationsRequired || false} onChange={updateSwitch('applicationsRequired')} />} label="Applications required?" />
                                </FormGroup>
                                <FormGroup>
                                    <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={data.allParticipantEmails || false} onChange={updateSwitch('allParticipantEmails')} />} label="All participant emails" />
                                </FormGroup>
                                <FormGroup>
                                    <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={data.howDidYouHear || false} onChange={updateSwitch('howDidYouHear')} />} label="How did you hear question" />
                                </FormGroup>
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel id="kp-select-label">KP Structure</InputLabel>
                                    <Select value={data.kpMode || "default"} label="KP  Structure" onChange={updateField("kpMode")} labelId="kp-select-label">
                                        {data.kpMode ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                                        {kpOptions}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel id="consent-select-label">Consent Structure</InputLabel>
                                    <Select value={data.consentMode || "default"} label="Consent Structure" onChange={updateField("consentMode")} labelId="consent-select-label">
                                        {data.kpMode ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                                        {consentOptions}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel id="attendance-select-label">Attendance Structure</InputLabel>
                                    <Select value={data.attendanceStructure || "default"} label="Attendance Structure" onChange={updateField("attendanceStructure")} labelId="attendance-select-label">
                                        {data.attendanceStructure ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                                        {attendanceOptions}
                                    </Select>
                                </FormControl>
                                <AttendanceConfig data={data.attendanceData} update={updateSubField("attendanceData")} />
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel id="fee-select-label">Fee Structure</InputLabel>
                                    <Select disabled={!Attendance} value={data.feeStructure || "default"} label="Fee Structure" onChange={updateField("feeStructure")} labelId="fee-select-label">
                                        {data.feeStructure ? null : <MenuItem key="default" value="default">Please select</MenuItem>}
                                        {feeOptions}
                                    </Select>
                                </FormControl>
                                <FeeConfig attendanceData={data.attendanceData} data={data.feeData ?? {}} update={updateSubField("feeData")} />
                                <CustomQuestionsForm data={data.customQuestions!} update={updateSubField("customQuestions")} />
                            </Grid>
                            <Grid container spacing={0}>
                                <Button disabled={!validate(data)} sx={{ mt: 2 }} variant="contained" onClick={create}>{mode == "create" ? "Create" : "Edit"}</Button>
                            </Grid>
                        </Grid>
                    </form>
                </Box>
            </Paper >
        </Grid>
    </Grid>
}

function CustomQuestionsForm({ data = [], update }: { data: JsonEventType["customQuestions"], update: any }) {
    const { addEmptyObjectToArray, updateArrayItem, deleteArrayItem } = getMemoUpdateFunctions(update)

    const deleteQuestion = useCallback((i) => e => {
        deleteArrayItem(i)
        e.preventDefault()
    }, [])

    const questions = data.map((q, i) => {
        return <QuestionItem i={i} key={i} question={q} updateArrayItem={updateArrayItem} deleteQuestion={deleteQuestion} />
    })

    return (<>
        <Typography sx={{ mt: 2 }} variant="h5">Custom Questions</Typography>
        {questions}
        <FormControl sx={{ mt: 2 }}>
            <Button variant="contained" onClick={addEmptyObjectToArray}>Add Question</Button>
        </FormControl>
    </>)
}

const QuestionItem = ({ i, question, updateArrayItem, deleteQuestion }: { i: number, question: any, updateArrayItem: any, deleteQuestion: any }) => {
    const { updateField } = getMemoUpdateFunctions(updateArrayItem(i))

    return (
        <Paper elevation={6} sx={{ mt: 2 }}>
            <Box key={i} p={2}>
                <FormControl sx={{ mt: 2 }}>
                    <InputLabel id={`question-select-label-${i}`}>Type</InputLabel>
                    <Select value={question.questionType || "default"} label="Question type" onChange={updateField("questionType")} labelId={`question-select-label-${i}`}>
                        <MenuItem value="default">Please select</MenuItem>
                        <MenuItem value="yesnochoice">Yes/No</MenuItem>
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="longtext">Long Text</MenuItem>
                    </Select>
                </FormControl>
                <IconButton color="error" onClick={deleteQuestion(i)}><Close /></IconButton>
                <TextField fullWidth sx={{ mt: 2 }} required id="outlined-required" label="Label" value={question.questionLabel || ''} onChange={updateField('questionLabel')} />
            </Box>
        </Paper>)
}