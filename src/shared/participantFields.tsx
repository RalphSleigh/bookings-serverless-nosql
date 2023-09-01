import { ReactNode } from "react";
import { EventType, JsonEventType, JsonParticipantType, ParticipantType } from "../lambda-common/onetable.js";
import React from "react";
import { GridColDef } from "@mui/x-data-grid";

abstract class Field {
    event: any;
    abstract fieldName: string

    constructor(event: JsonEventType | EventType) {
        this.event = event
    }

    enabled() {
        return true
    }

    dataGridColumnDef(): GridColDef {
        return { field: this.fieldName, headerName: this.fieldName, renderCell: this.dataGridCellRenderer.bind(this), valueGetter: params => params.row.participant, sortComparator: this.sortComparator.bind(this) }
    }

    dataGridCellRenderer(params): ReactNode {
        const value = this.value(params.value)
        if(value === undefined) return "N/A"
        return <>{value.toString()}</>
    }

    sortComparator(a: JsonParticipantType, b: JsonParticipantType) {
        if(this.value(a) === undefined) return 1
        if(this.value(b) === undefined) return -1
        return this.value(a).toString().localeCompare(this.value(b).toString())
    }

    csvCellValue(participant: JsonParticipantType | ParticipantType) {
        const value = this.value(participant)
        if(value === undefined) return "N/A"
        return value.toString()
    }

    abstract value(participant: JsonParticipantType | ParticipantType): any | undefined
}

class Name extends Field {
    fieldName = "Name"
    value (participant: JsonParticipantType) {
        return participant.basic.name
    }
}

class Diet extends Field {
    fieldName = "Diet"
    value (participant: JsonParticipantType) {
        return participant.kp?.diet
    }
}

class Photo extends Field {
    fieldName = "Photo"
    value (participant: JsonParticipantType) {
        return participant.consent?.photo
    }

    enabled(): boolean {
        return this.event.bigCampMode
    }
}

export class CSVCurrent extends Field {
    fieldName = "Current"
    value (participant: JsonParticipantType) {
        //@ts-ignore
        return participant.current
    }
}

export class Fields {
    event: JsonEventType | EventType;
    fields: Field[];
    constructor(event: JsonEventType | EventType) {
        this.event = event

        this.fields = [
            new Name(event),
            new Diet(event),
            new Photo(event)
        ]    
    }
    
    getColumnDefs(){
        return this.fields.filter(f => f.enabled()).map(f => f.dataGridColumnDef())
    }

    getCSVHeaders() {
        return this.fields.filter(f => f.enabled()).map(f => f.fieldName)
    }

    getCSVValues(participant: JsonParticipantType | ParticipantType) {
        return this.fields.filter(f => f.enabled()).map(f => f.csvCellValue(participant))
    }
}