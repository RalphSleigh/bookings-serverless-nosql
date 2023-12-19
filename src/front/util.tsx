import { DatePicker } from "@mui/x-date-pickers"
import { parseISO } from "date-fns"
import { zonedTimeToUtc } from 'date-fns-tz'
import React from "react"

export function parseDate(date: Date | string | undefined): Date | null {
    if (!date) return null
    if (date instanceof Date) return date
    return parseISO(date)
}

export function toUtcDate(date: Date | string | undefined): Date | null {

    let localDate = parseDate(date)
    if (!localDate) return null

    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
}

export function toLocalDate(date: Date | string | undefined): Date | null {
    let localDate = parseDate(date)
    if (!localDate) return null

    return new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000)
}

//We need the dates to work both in the browser in whatever timezone thats in, and also serverside. 
//This date picker will convert the picked date to the start of that day in UTC, and expects a UTC datetime in its value.
//This way we always send the server the same date that the user picked, and not possibly a UTC datetime thats outside that day
//Downside is we need to recovert it back to local time before displaying 
export function UtcDatePicker(props) {
    const { value, onChange, ...rest } = props
    const convertOnChange = (d, c) => {
        onChange(toUtcDate(d), c)
    }
    return <DatePicker value={toLocalDate(value)} onChange={convertOnChange}  {...rest} isRequired />
}

export function getMemoUpdateFunctions(update) {
    return React.useMemo(() => ({
        updateField: field => e => {
            update(data => ({ ...data, [field]: e.target.value }))
            e.preventDefault()
        },
        updateParticipantDate:  field => e => {
            update(data => ({ ...data, [field]: e}))
        },
        updateSwitch: field => e => {
            update(data => ({ ...data, [field]: e.target.checked }))
        },
        addEmptyObjectToArray: e => {
            update(data => ([...data, {}]))
        },
        updateArrayItem: i => {
            return subdataFunction => {
                update(data => {
                    const newData = [...data]
                    newData[i] = subdataFunction(newData[i])
                    return newData
                })
            }
        },
        deleteArrayItem: i => {
            update(data => {
                const newData = [...data]
                newData.splice(i, 1)
                return newData
            })
        },
        updateSubField: subfield => {
            return subdataFunction => {
                update(data => ({...data, [subfield]: subdataFunction(data[subfield])}))
            }
        },
    }), [])
}

