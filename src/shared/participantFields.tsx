import { ReactNode } from "react";
import { EventType, JsonEventType, JsonParticipantType, JsonUserResponseType, JsonUserType, OnetableEventType, ParticipantType, RoleType, UserResponseType, UserWithRoles } from "../lambda-common/onetable.js";
import React from "react";
import { GridColDef, GridColumnVisibilityModel, GridFilterOperator, getGridDateOperators } from "@mui/x-data-grid";
import { JsonParticipantWithExtraType } from "./computedDataTypes.js";
import { parseDate } from "./util.js";
import { differenceInYears, format, formatDistanceToNow, formatISO9075 } from "date-fns";
import { getAgeGroup } from "./woodcraft.js";
import { useMediaQuery, useTheme } from "@mui/material";
import { readFile } from "node:fs";

abstract class Field {
    event: JsonEventType | OnetableEventType;
    abstract fieldName: string
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "Money", "KP", "Comms", "Accessibility", "View - Village"]
    defaultValue: string = "N/A"

    enabledCSV: boolean = true
    visbileMobile: boolean = true
    visibleDesktop: boolean = true
    filterOperators?: () => GridFilterOperator[]

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
        const def: GridColDef = { type: "string", field: this.fieldName, headerName: this.fieldName, renderCell: this.dataGridCellRenderer.bind(this), valueGetter: params => this.value.bind(this)(params.row.participant), sortComparator: this.sortComparator.bind(this), flex: 1 }
        if(this.filterOperators) def.filterOperators = this.filterOperators()
        return def
    }

    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        if(params.value === undefined) return this.defaultValue
        return <>{params.value.toString()}</>
    }

    sortComparator(a: any, b: any) {
        if(a === undefined) return 1
        if(b === undefined) return -1
        if(a instanceof Date && b instanceof Date) return b.getTime() - a.getTime()
        return a.toString().localeCompare(b.toString())
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

class Organisation extends Field {
    fieldName = "Organisation"
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.booking.basic.organisation
    }
}

class Age extends Field {
    fieldName = "Age"

    visbileMobile = false
    visibleDesktop = false

    value (participant: JsonParticipantWithExtraType | ParticipantType) {
        return participant
        
    }

    dataGridCellRenderer(params: {value: JsonParticipantWithExtraType}): ReactNode {
        return format(params.value.dob, "dd-MM-yyyy")
    }

    csvCellValue(participant: JsonParticipantWithExtraType) {
        return format(participant.dob, "yyyy-MM-dd")
    }

    filterOperators = () => {
        const existing = getGridDateOperators()
        return existing.map(e => {
            const existing = e.getApplyFilterFn
            const newFilter = (filterItem,column) => {
                const filterFunction = existing(filterItem, column)
                if(!filterFunction) return filterFunction
                return function newFilterFunction(params) {
                    return filterFunction!({...params, value: params.value.dob})
                }
            }
            return {...e, getApplyFilterFn: newFilter}
            })
    }

    sortComparator(a: JsonParticipantWithExtraType | ParticipantType, b: JsonParticipantWithExtraType | ParticipantType) {
        if('dob' in a && 'dob' in b) return b.dob.getTime() - a.dob.getTime()
        return parseDate(b.basic.dob)!.getTime() - parseDate(a.basic.dob)!.getTime()
    }
}

class DisplayAge extends Field {
    fieldName = "Age Group"
    value (participant: JsonParticipantWithExtraType | ParticipantType) {
        return participant
        
    }

    dataGridCellRenderer(params): ReactNode {
        if('age' in params.value) return params.value.ageGroup.displayAgeGroup(params.value.age)
        const startDate = parseDate(this.event.startDate)!
        const age = differenceInYears(startDate, parseDate(params.value.basic.dob)!)
        return getAgeGroup(age).displayAgeGroup(age)
    }

    csvCellValue(participant: JsonParticipantWithExtraType | ParticipantType) {
        if('age' in participant) return participant.ageGroup.displayAgeGroup(participant.age)
            const startDate = parseDate(this.event.startDate)!
            const age = differenceInYears(startDate, parseDate(participant.basic.dob)!)
            return getAgeGroup(age).displayAgeGroup(age)
    }

    filterOperators = () => {
        const existing = getGridDateOperators()
        return existing.map(e => {
            const existing = e.getApplyFilterFn
            const newFilter = (filterItem,column) => {
                const filterFunction = existing(filterItem, column)
                if(!filterFunction) return filterFunction
                return function newFilterFunction(params) {
                    return filterFunction({...params, value: params.value.dob})
                }
            }
            return {...e, getApplyFilterFn: newFilter}
            })
    }

    sortComparator(a: JsonParticipantWithExtraType | ParticipantType, b: JsonParticipantWithExtraType | ParticipantType) {
        if('dob' in a && 'dob' in b) return b.dob.getTime() - a.dob.getTime()
        return parseDate(b.basic.dob)!.getTime() - parseDate(a.basic.dob)!.getTime()
    }
}

class AttendanceOption extends Field {
    fieldName = "Attendance Option"
    visbileMobile = false
    enabled(): boolean {
        return this.event.attendanceStructure == "options"
    }
    value (participant: JsonParticipantWithExtraType) {
        if(typeof participant.attendance?.option === "number" && this.event.attendanceData?.options) return this.event.attendanceData?.options?.[participant.attendance.option!]
        return this.defaultValue
    }
}

class Diet extends Field {
    fieldName = "Diet"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    value (participant: JsonParticipantWithExtraType | ParticipantType) {
        return participant.kp?.diet
    }
    sortComparator(a: string, b: string) {
        const sortIndex = ["omnivore", "pescatarian", "vegetarian", "vegan"]
        return sortIndex.indexOf(a) - sortIndex.indexOf(b)
    }
}

class AddtionalDiet extends Field {
    fieldName = "Additional Diet"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    defaultValue = ""
    value (participant: JsonParticipantWithExtraType | ParticipantType) {
        return participant.kp?.details
    }
}

class DietPreferences extends Field {
    fieldName = "Diet Preferences"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    defaultValue = ""
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.preferences
    }
}

class DietNutAllergy extends Field {
    fieldName = "Nut Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.nuts
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "❌"
        if(value === false) return ""
        return ""
    }

    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class DietGlutenAllergy extends Field {
    fieldName = "Gluten Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.gluten
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "❌"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class DietSoyaAllergy extends Field {
    fieldName = "Soya Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.soya
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "❌"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class DietDairyAllergy extends Field {
    fieldName = "Dairy Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.dairy
    }
    dataGridCellRenderer(params): ReactNode {
       //const value = this.value(params.value)
       const value = params.value
        if(value === true) return "❌"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class DietEggAllergy extends Field {
    fieldName = "Egg Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.egg
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "❌"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class DietPorkAllergy extends Field {
    fieldName = "No Pork"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.pork
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "❌"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class DietChickpeaAllergy extends Field {
    fieldName = "Chickpea Allergy"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.chickpea
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "❌"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class DietDiabetic extends Field {
    fieldName = "Diabetic"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.diabetic
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "❌"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class DietContactMe extends Field {
    fieldName = "Contact Me"
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "KP", "View - Village"]
    visbileMobile = false
    enabled(): boolean {
        return this.event.kpMode == "large"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.kp?.contactMe
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "❌"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class PhotoConsent extends Field {
    fieldName = "Photo Consent"
    visbileMobile = false
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "View - Village"]
    enabled(): boolean {
        return this.event.consentMode == "camp100"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.consent?.photo
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "✔️"
        if(value === false) return "❌"
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class RSEConsent extends Field {
    fieldName = "RSE Consent"
    visbileMobile = false
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View", "View - Village"]
    enabled(): boolean {
        return this.event.consentMode == "camp100"
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.consent?.sre
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "✔️"
        if(value === false) return "❌"
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class Medical extends Field {
    fieldName = "Medical"
    visbileMobile = false
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "Accessibility", "View - Village"]
    defaultValue = ""
    value (participant: JsonParticipantWithExtraType) {
        return participant.medical?.details
    }
}

class Accessbility extends Field {
    fieldName = "Accessbility"
    visbileMobile = false
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "Accessibility", "View - Village"]
    defaultValue = ""
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.medical?.accessibility
    }
}

class AccessbilityContactMe extends Field {
    fieldName = "Accessbility Contact Me"
    visbileMobile = false
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "Accessibility", "View - Village"]
    defaultValue = ""
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.medical?.contactMe
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "✔️"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class FirstAid extends Field {
    fieldName = "First Aid"
    visbileMobile = false
    roles: Array<RoleType["role"]> = ["Owner", "Manage", "View - Village"]
    defaultValue = ""
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value (participant: JsonParticipantWithExtraType) {
        return participant.medical?.firstAid
    }
    dataGridCellRenderer(params): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        if(value === true) return "✔️"
        if(value === false) return ""
        return ""
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return this.value(participant) ? true : ""
    }
}

class Village extends Field {
    fieldName = "Village"
    visbileMobile = false
    visibleDesktop = false
    defaultValue = ""
    value (participant: JsonParticipantWithExtraType) {
        return this.event.villages?.find(v => v.name === participant.booking.village) ? participant.booking.village : ""
    }
}

class Town extends Field {
    fieldName = "Town"
    visbileMobile = false
    visibleDesktop = false
    defaultValue = ""
    value (participant: JsonParticipantWithExtraType) {
        return participant.booking.town ? participant.booking.town : ""
    }
}

export class ComputedAttendaceFirstThree extends Field {
    fieldName = "First Three Days"
    visbileMobile = false
    visibleDesktop = false
    value (participant: JsonParticipantWithExtraType) {
        return participant.attendance?.option ===  0 || participant.attendance?.option === 1
    }
}

export class ComputedAttendaceLastSeven extends Field {
    fieldName = "Last Seven Days"
    visbileMobile = false
    visibleDesktop = false
    value (participant: JsonParticipantWithExtraType) {
        return participant.attendance?.option ===  0 || participant.attendance?.option === 2
    }
}

class Created extends Field {
    fieldName = "Created"
    visbileMobile = false
    value (participant: JsonParticipantWithExtraType) {
        return new Date(participant.created)
    }

    dataGridCellRenderer(params: any): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        return <>{formatDistanceToNow(value)} ago</>
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return formatISO9075(this.value(participant))
    }
}

class Updated extends Field {
    fieldName = "Updated"
    visbileMobile = false
    value (participant: JsonParticipantWithExtraType) {
        return new Date(participant.updated)
    }

    dataGridCellRenderer(params: any): ReactNode {
        //const value = this.value(params.value)
        const value = params.value
        return <>{formatDistanceToNow(value)} ago</>
    }
    csvCellValue(participant: JsonParticipantWithExtraType) {
        return formatISO9075(this.value(participant))
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
            new DisplayAge(event),
            new Email(event),
            new AttendanceOption(event),
            new BookedBy(event),
            new Organisation(event),
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
            new Accessbility(event),
            new AccessbilityContactMe(event),
            new FirstAid(event),
            new PhotoConsent(event),
            new RSEConsent(event),
            new Village(event),
            new Town(event),
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