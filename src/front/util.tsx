import { DatePicker } from "@mui/x-date-pickers"
import { differenceInYears, parseISO } from "date-fns"
import { zonedTimeToUtc } from 'date-fns-tz'
import React from "react"
import { JsonBookingType, JsonEventType, JsonParticipantType } from "../lambda-common/onetable.js"
import { getAgeGroup } from "../shared/woodcraft.js"
import { JsonParticipantWithExtraType, JsonBookingWithExtraType } from "../shared/computedDataTypes.js"
import { parseDate } from "../shared/util.js"

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

export function useDebounceState<T>(defaultValue: T, delay: number): [T, T, (T) => void] {
    const [value, setValue] = React.useState(defaultValue)
    const [debouncedValue, setDebouncedValue] = React.useState(defaultValue)

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => clearTimeout(timeoutId)
    }, [value, delay])

    return [value, debouncedValue, setValue]
}

export function bookingsParticipantSearch(bookings: JsonBookingWithExtraType[], search: string): JsonBookingWithExtraType[] {
    return bookings
    .map(b => {
        const filteredParicipants = b.participants.filter(p => p.basic.name.toLowerCase().includes(search.toLowerCase()))
        return {...b, participants: filteredParicipants}
    })
    .filter(b => b.participants.length > 0)
}

export function bookingsBookingSearch(bookings: JsonBookingWithExtraType[], search: string): JsonBookingWithExtraType[] {
    return bookings
    .filter(b => {
        return b.basic.contactName.toLowerCase().includes(search.toLowerCase()) || b.basic.contactEmail.toLowerCase().includes(search.toLowerCase()) || b.basic.district?.toLowerCase().includes(search.toLowerCase())
    })
}