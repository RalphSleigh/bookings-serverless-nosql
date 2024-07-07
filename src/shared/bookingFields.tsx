import { GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { BookingType, JsonBookingType, JsonEventType, JsonUserResponseType, OnetableEventType, UserWithRoles } from "../lambda-common/onetable.js";
import { ReactNode } from 'react';
import React from "react";
import { Link } from "react-router-dom";
import { capitalizeWord } from "./util.js";

abstract class Field {
    event: JsonEventType | OnetableEventType;
    fieldName: string = ""
    roles: string[] = ["Owner", "Manage", "View", "Money", "KP", "Comms", "Accessibility"]
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
        if (user?.admin) return true
        //@ts-ignore
        return !!user?.roles?.filter(r => r.eventId === this.event.id && this.roles.includes(r.role)).length;
    }

    dataGridColumnDef(): GridColDef {
        return { field: this.fieldName, headerName: this.fieldName, renderCell: this.dataGridCellRenderer.bind(this), valueGetter: params => params.row.booking, sortComparator: this.sortComparator.bind(this), flex: 1 }
    }

    dataGridCellRenderer(params): ReactNode {
        const value = this.value(params.value)
        if (value === undefined) return this.defaultValue
        return <>{value.toString()}</>
    }

    sortComparator(a: JsonBookingType | BookingType, b: JsonBookingType | BookingType) {
        if (this.value(a) === undefined) return 1
        if (this.value(b) === undefined) return -1
        return this.value(a).toString().localeCompare(this.value(b).toString())
    }

    csvCellValue(booking: JsonBookingType | BookingType) {
        const value = this.value(booking)
        if (value === undefined) return this.defaultValue
        return value.toString()
    }

    abstract value(booking: JsonBookingType | BookingType): any | undefined
}

class BookingTypeField extends Field {
    fieldName = "Type"
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value(booking: JsonBookingType) {
        return capitalizeWord(booking.basic.bookingType)
    }
}

class BookingOrganisationField extends Field {
    fieldName = "Organisation"
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value(booking: JsonBookingType) {
        return booking.basic.organisation
    }
}

class BookingDistrictField extends Field {
    fieldName = "District"
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value(booking: JsonBookingType) {
        return booking.basic.district
    }
}

class BookingContactName extends Field {
    fieldName = "Contact Name"
    value(booking: JsonBookingType) {
        return booking.basic.contactName
    }
}

class BookingContactEmail extends Field {
    fieldName = "Contact Email"
    value(booking: JsonBookingType) {
        return booking.basic.contactEmail
    }
}

class BookingHowDidYouHear extends Field {
    fieldName = "How did you hear about us?"
    enabled(): boolean {
        return this.event.howDidYouHear
    }
    value(booking: JsonBookingType) {
        return booking.basic.howDidYouHear
    }
}

class BookingContactPhone extends Field {
    fieldName = "Contact Phone"
    value(booking: JsonBookingType) {
        return booking.basic.contactPhone
    }
}

class NumberOfParticipants extends Field {
    fieldName = "Participants"
    value(booking: JsonBookingType) {
        return booking.participants.length
    }
    sortComparator(a: BookingType | JsonBookingType, b: BookingType | JsonBookingType) {
        return a.participants.length - b.participants.length
    }
}

class EmergencyContactName extends Field {
    fieldName = "Emergency Contact Name"
    value(booking: JsonBookingType) {
        return booking.emergency?.name
    }
}

class EmergencyContactPhone extends Field {
    fieldName = "Emergency Contact Phone"
    value(booking: JsonBookingType) {
        return booking.emergency?.phone
    }
}

class CampWith extends Field {
    fieldName = "Camp With"
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value(booking: JsonBookingType) {
        return booking.camping?.campWith
    }
}

class CanBringEquipemnt extends Field {
    fieldName = "Can Bring Equipment"
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value(booking: BookingType | JsonBookingType) {
        return booking.camping?.canBringEquipment
    }
}

class CampingAccessibilityNeeds extends Field {
    fieldName = "Accessibility Needs"
    enabled(): boolean {
        return this.event.bigCampMode
    }
    value(booking: BookingType | JsonBookingType) {
        return booking.camping?.accessibilityNeeds
    }
}

class EditLink extends Field {
    fieldName = "Edit"
    roles = ["Owner", "Manage"]
    enabledCSV = false
    value(booking: JsonBookingType) {
        return booking.userId
    }
    dataGridCellRenderer(params): ReactNode {
        const value = this.value(params.value)
        if (value === undefined) return this.defaultValue
        return <Link to={`/event/${this.event.id}/edit-booking/${value}`}>Edit</Link>
    }
}

class Deleted extends Field {
    fieldName = "Deleted"
    enabledCSV = false
    value(booking: JsonBookingType) {
        return booking.deleted
    }

}

class CustomQuestionText extends Field {
    index: number
    constructor(question: JsonEventType["customQuestions"][0], index: number, event: JsonEventType | OnetableEventType) {
        super(event)
        this.fieldName = question.questionLabel
        this.index = index
    }

    value(booking: JsonBookingType) {
        return booking.customQuestions?.[this.index]
    }
}

export class BookingFields {
    event: JsonEventType | OnetableEventType;
    fields: Field[];
    constructor(event: JsonEventType | OnetableEventType) {
        this.event = event

        this.fields = [
            new BookingTypeField(event),
            new BookingOrganisationField(event),
            new BookingDistrictField(event),
            new BookingContactName(event),
            new BookingContactEmail(event),
            new BookingContactPhone(event),
            new NumberOfParticipants(event),
            new EmergencyContactName(event),
            new EmergencyContactPhone(event),
            new BookingHowDidYouHear(event),
            new CampWith(event),
            new CanBringEquipemnt(event),
            new CampingAccessibilityNeeds(event)
        ]

        event.customQuestions?.forEach((q, i) => {
            this.fields.push(new CustomQuestionText(q, i, event))
        })

        this.fields.push(new EditLink(event))
        this.fields.push(new Deleted(event))
    }

    getColumnDefs(user) {
        return this.fields.filter(f => f.enabled() && f.permission(user)).map(f => f.dataGridColumnDef())
    }

    getCSVHeaders(user) {
        return this.fields.filter(f => f.enabledCSV && f.enabled() && f.permission(user)).map(f => f.fieldName)
    }

    getCSVValues(booking: JsonBookingType | BookingType, user) {
        return this.fields.filter(f => f.enabledCSV && f.enabled() && f.permission(user)).map(f => f.csvCellValue(booking))
    }

    getDefaultColumnVisibility(): GridColumnVisibilityModel {
        return this.fields.reduce((acc, f) => {
            acc[f.fieldName] = true
            return acc
        }, {})
    }
}