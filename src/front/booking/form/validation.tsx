import React from "react"
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js"
import { Alert, AlertTitle } from "@mui/material"
import { KpStructure } from "../../../shared/kp/kp_class.js"

type validationResults = string[]

export function validate(event: JsonEventType, kpConfig: KpStructure, data: Partial<JsonBookingType>, permission: Boolean): validationResults {
    const results: validationResults = []
    const bigCamp = event.bigCampMode

    if (!data.basic?.contactName) results.push("Please enter your contact name")
    if (!data.basic?.contactEmail) results.push("Please enter your contact email")
    if (!data.basic?.contactPhone) results.push("Please enter your contact phone")
    if (bigCamp) {
        if (!data.basic?.district) results.push("Please enter your group/district name")
    }

    if (data.participants) data.participants.forEach((participant, i) => {
        results.push(...vaildateParticipant(event, kpConfig, participant, i))
    })

    if (!data.emergency?.name) results.push("Please enter an emergency contact name")
    if (!data.emergency?.phone) results.push("Please enter an emergency contact phone number")

    event.customQuestions.forEach((question, i) => {
        if (question.questionType === "yesnochoice") {
            if (typeof (data.customQuestions?.[i]) !== "boolean") results.push(`Please answer question "${question.questionLabel}"`)
        }
    })

    if(permission !== true) results.push("Please tick the permission checkbox")  

    return results
}

function vaildateParticipant(event: JsonEventType, kpConfig: KpStructure, participant: Partial<JsonBookingType["participants"][0]>, i: number): validationResults {
    const results: validationResults = []
    const bigCamp = event.bigCampMode

    if (!participant.basic?.name) results.push(`Please enter a name for Camper #${i + 1}`)

    if (participant.basic?.name) {
        if (!participant.basic?.dob) results.push(`Please enter a date of birth for ${participant.basic?.name}`)
        results.push(...kpConfig.validate(participant))
    }

    return results
}

export function BookingValidationResults({ validationResults: validationResults }) {
    if (validationResults.length === 0) return null

    return (<Alert severity="warning" sx={{ mt: 2, pt: 2 }}>
        <AlertTitle>Still to do:</AlertTitle>
        <ul>
            {validationResults.map((result, i) => <li key={i}>{result}</li>)}
        </ul>
    </Alert>)
}

