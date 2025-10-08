import React from "react"
import { JsonBookingType, JsonEventType, JsonParticipantType } from "../../../lambda-common/onetable.js"
import { Alert, AlertTitle } from "@mui/material"
import { PartialDeep } from "type-fest"
import { getKP } from "../../../shared/kp/kp.js"
import { getAttendance } from "../../../shared/attendance/attendance.js"
import { getConsent } from "../../../shared/consents/consent.js"
import { KpStructure } from "../../../shared/kp/kp_class.js"
import { AttendanceStructure } from "../../../shared/attendance/attendanceStructure.js"
import { ConsentStructure } from "../../../shared/consents/consents_class.js"

type validationResults = string[]

export class Validation {
    event: JsonEventType
    kpConfig: KpStructure
    attendanceConfig: AttendanceStructure
    consentConfig: ConsentStructure

    constructor(event) {
        this.event = event
        this.kpConfig = getKP(event)
        this.attendanceConfig = getAttendance(event)
        this.consentConfig = getConsent(event)
    }

    validate(data: PartialDeep<JsonBookingType>, permission: Boolean): validationResults {
        const results: validationResults = []
        const bigCamp = this.event.bigCampMode
        const emailSet = new Set()
        const nameAndDOBSet = new Set()

        if (bigCamp) {

            const districtRequired = data.basic?.bookingType == "group" && data.basic?.organisation == "Woodcraft Folk"

            if (districtRequired && !data.basic?.district) results.push("Please enter your group/district name")
            if (!data.basic?.bookingType) results.push("Please select your booking type")
            if (!data.basic?.organisation) results.push("Please select your organisation")
        }

        if (!data.basic?.contactName) results.push("Please enter your contact name")
        if (!data.basic?.contactEmail) results.push("Please enter your contact email")
        if (!data.basic?.contactPhone) results.push("Please enter your contact phone")

        if (data.participants) data.participants.forEach((participant, i) => {
            results.push(...this.validateParticipant(participant, i))
            if (participant.basic?.name) {
                emailSet.add(participant.basic?.email)
                nameAndDOBSet.add(`${participant.basic?.name}`)
            }
        })

        if (bigCamp && data.basic?.bookingType === "individual") {
            if (!data.emergency?.name) results.push("Please enter an emergency contact name")
            if (!data.emergency?.phone) results.push("Please enter an emergency contact phone number")
        }

        this.event.customQuestions.forEach((question, i) => {
            if (question.questionType === "yesnochoice") {
                if (typeof (data.customQuestions?.[i]) !== "boolean") results.push(`Please answer question "${question.questionLabel}"`)
            }
        })

        const participantWithNames = data.participants?.filter(p => p.basic?.name)

        if (bigCamp && this.event.allParticipantEmails && participantWithNames && participantWithNames?.length > 0) {
            const requiredUniqueEmails = Math.floor(Math.pow(Math.max(1, (participantWithNames?.length || 1) - 5), 0.75))
            if (emailSet.size < requiredUniqueEmails) results.push(`You appear to have entered the same email address for multiple campers.`)
        }

        if (participantWithNames && participantWithNames?.length > 1 && nameAndDOBSet.size < participantWithNames.length) results.push(`You appear to have booked duplicate campers.`)

        if (!(data.participants && data.participants?.length > 0)) results.push("Please book at least one camper")

        if (permission !== true) results.push("Please tick the permission checkbox")

        return results
    }

    validateParticipant(participant: PartialDeep<JsonParticipantType>, i: number): validationResults {
        const results: validationResults = []

        if (!participant.basic?.name) results.push(`Please enter a name for Camper #${i + 1}`)

        if (participant.basic?.name) {
            if (!participant.basic?.dob) results.push(`Please enter a date of birth for ${participant.basic?.name}`)
            if (this.event.allParticipantEmails && !participant.basic?.email) results.push(`Please enter an email for ${participant.basic?.name}`)
            results.push(...this.kpConfig.validate(participant))
            results.push(...this.attendanceConfig.validate(participant))
            results.push(...this.consentConfig.validate(this.event, participant))
        }

        return results
    }
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

