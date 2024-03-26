import { ReactNode } from "react";
import { EventType, JsonEventType, JsonParticipantType, JsonUserResponseType, JsonUserType, OnetableEventType, ParticipantType, RoleType, UserResponseType, UserWithRoles } from "../lambda-common/onetable.js";
import React from "react";
import { GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { JsonParticipantWithExtraType } from "./computedDataTypes.js";
import { parseDate } from "./util.js";
import { differenceInYears, formatDistanceToNow } from "date-fns";
import { getAgeGroup } from "./woodcraft.js";
import { useMediaQuery, useTheme } from "@mui/material";

abstract class Field {
    event: JsonEventType | OnetableEventType;
    abstract fieldName: string
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "Money", "KP"]
    defaultValue: string = "N/A"

    enabledCSV: boolean = true
    visbileMobile: boolean = true
    visibleDesktop: boolean = true

    constructor(event: JsonEventType | OnetableEventType) {
        this.event = event
    }

    enabled() {
        return true
    }

    permission(user: JsonUserResponseType | UserWithRoles): boolean {
        if(user?.admin) return true
        //@ts-ignore
        return !!user?.roles?.filter(r => r.eventId === this.event.id && this.roles.includes(r.role)).length;
    }

    dataGridColumnDef(): GridColDef {
        return { field: this.fieldName, headerName: this.fieldName, renderCell: this.dataGridCellRenderer.bind(this), valueGetter: params => params.row.participant, sortComparator: this.sortComparator.bind(this), flex: 1 }
    }

    dataGridCellRenderer(params): ReactNode {
        const value = this.value(params.value)
        if(value === undefined) return this.defaultValue
        return <>{value.toString()}</>
    }

    sortComparator(a: JsonParticipantWithExtraType | ParticipantType, b: JsonParticipantWithExtraType | ParticipantType) {
        if(this.value(a) === undefined) return 1
        if(this.value(b) === undefined) return -1
        return this.value(a).toString().localeCompare(this.value(b).toString())
    }

    csvCellValue(participant: JsonParticipantWithExtraType | ParticipantType) {
        const value = this.value(participant)
        if(value === undefined) return this.defaultValue
        return value.toString()
    }

    abstract value(participant: JsonParticipantWithExtraType | ParticipantType): any | undefined
}

class Name extends Field {
    fieldName = "Name"
    value (participant: JsonParticipantWithExtraType) {
        return participant.basic.name
    }
}

class Email extends Field {
    fieldName = "Email"
    visbileMobile = false
    enabled(): boolean {
        return this.event.allParticipantEmails
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.basic.email
    }
}

class BookedBy extends Field {
    fieldName = "Booked By"
    value (participant: JsonParticipantWithExtraType) {
        return this.event.bigCampMode ? participant.booking.basic.district : participant.booking.basic.contactName
    }
}

class Age extends Field {
    fieldName = "Age"
    value (participant: JsonParticipantWithExtraType | ParticipantType) {
        if('age' in participant) return participant.ageGroup.displayAgeGroup(participant.age)
        const startDate = parseDate(this.event.startDate)!
        const age = differenceInYears(startDate, parseDate(participant.basic.dob)!)
        return getAgeGroup(age).displayAgeGroup(age)
    }
    sortComparator(a: JsonParticipantWithExtraType | ParticipantType, b: JsonParticipantWithExtraType | ParticipantType) {
        if('age' in a && 'age' in b) return a.age - b.age
        const startDate = parseDate(this.event.startDate)!
        return differenceInYears(startDate, parseDate(a.basic.dob)!)-differenceInYears(startDate, parseDate(b.basic.dob)!)
    }
}

class AttendanceOption extends Field {
    fieldName = "Attendance Option"
    visbileMobile = false
    enabled(): boolean {
        return this.event.attendanceStructure == "options"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.attendance.option
    }
}

class Diet extends Field {
    fieldName = "Diet"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    value (participant: JsonParticipantWithExtraType | ParticipantType) {
        return participant.kp?.diet
    }
    sortComparator(a: JsonParticipantWithExtraType | ParticipantType, b: JsonParticipantWithExtraType | ParticipantType) {
        const sortIndex = ["omnivore", "pescatarian", "vegetarian", "vegan"]
        return sortIndex.indexOf(a.kp?.diet!) - sortIndex.indexOf(b.kp?.diet!)
    }
}

class AddtionalDiet extends Field {
    fieldName = "Additional Diet"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    defaultValue = ""
    value (participant: JsonParticipantWithExtraType | ParticipantType) {
        return participant.kp?.details
    }
}

class DietPreferences extends Field {
    fieldName = "Diet Preferences"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.preferences
    }
}

class DietNutAllergy extends Field {
    fieldName = "Nut Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.nuts
    }
}

class DietGlutenAllergy extends Field {
    fieldName = "Gluten Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.gluten
    }
}

class DietSoyaAllergy extends Field {
    fieldName = "Soya Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.soya
    }
}

class DietDairyAllergy extends Field {
    fieldName = "Dairy Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.dairy
    }
}

class DietEggAllergy extends Field {
    fieldName = "Egg Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.egg
    }
}

class DietPorkAllergy extends Field {
    fieldName = "No Pork"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.pork
    }
}

class DietChickpeaAllergy extends Field {
    fieldName = "Chickpea Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.chickpea
    }
}

class DietDiabetic extends Field {
    fieldName = "Diabetic"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.diabetic
    }
}

class DietContactMe extends Field {
    fieldName = "Contact Me"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.contactMe
    }
}

class PhotoConsent extends Field {
    fieldName = "Photo Consent"
    visbileMobile = false
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View"]
    enabled(): boolean {
        return this.event.consentMode == "camp100"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.consent?.photo
    }
}

class RSEConsent extends Field {
    fieldName = "RSE Consent"
    visbileMobile = false
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View"]
    enabled(): boolean {
        return this.event.consentMode == "camp100"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.consent?.sre
    }
}

class Medical extends Field {
    fieldName = "Medical"
    visbileMobile = false
    roles: Array<RoleType["role"]> = ["Owner", "Manage"]
    defaultValue = ""
    value (participant: JsonParticipantWithExtraType) {
        return participant.medical?.details
    }
}

class Created extends Field {
    fieldName = "Created"
    visbileMobile = false
    value (participant: JsonParticipantWithExtraType) {
        return new Date(participant.created)
    }

    dataGridCellRenderer(params: any): ReactNode {
        const value = this.value(params.value)
        return <>{formatDistanceToNow(value)} ago</>
    }
}

class Updated extends Field {
    fieldName = "Updated"
    visbileMobile = false
    value (participant: JsonParticipantWithExtraType) {
        return new Date(participant.updated)
    }

    dataGridCellRenderer(params: any): ReactNode {
        const value = this.value(params.value)
        return <>{formatDistanceToNow(value)} ago</>
    }
}


export class CSVCurrent extends Field {
    fieldName = "Current"
    value (participant: JsonParticipantWithExtraType) {
        //@ts-ignore
        return participant.current
    }
}

export class ParticipantFields {
    event: JsonEventType | OnetableEventType;
    fields: Field[];
    constructor(event: JsonEventType | OnetableEventType) {
        this.event = event

        this.fields = [
            new Name(event),
            new Age(event),
            new Email(event),
            new AttendanceOption(event),
            new BookedBy(event),
            new Diet(event),
            new AddtionalDiet(event),
            new DietPreferences(event),
            new DietNutAllergy(event),
            new DietGlutenAllergy(event),
            new DietSoyaAllergy(event),
            new DietDairyAllergy(event),
            new DietEggAllergy(event),
            new DietPorkAllergy(event),
            new DietChickpeaAllergy(event),
            new DietDiabetic(event),
            new DietContactMe(event),
            new Medical(event),
            new PhotoConsent(event),
            new RSEConsent(event),
            new Created(event),
            new Updated(event),
        ]    
    }
    
    getColumnDefs(user){
        return this.fields.filter(f => f.enabled() && f.permission(user)).map(f => f.dataGridColumnDef())
    }

    getCSVHeaders(user) {
        return this.fields.filter(f => f.enabledCSV && f.enabled() && f.permission(user)).map(f => f.fieldName)
    }

    getCSVValues(participant: JsonParticipantWithExtraType | ParticipantType, user) {
        return this.fields.filter(f => f.enabledCSV && f.enabled() && f.permission(user)).map(f => f.csvCellValue(participant))
    }

    getDefaultColumnVisibility(user: JsonUserType | UserResponseType): GridColumnVisibilityModel {
        const theme = useTheme()
        const wide = useMediaQuery(theme.breakpoints.up('sm'))
        return this.fields.reduce((acc, f) => {
            acc[f.fieldName] = wide ? f.visibleDesktop : f.visbileMobile
            return acc
        }, {})
    }
}