import { differenceInYears, parseISO } from "date-fns"
import React from "react"
import { getAgeGroup } from "./woodcraft.js"
import { JsonBookingWithExtraType, JsonParticipantWithExtraType } from "./computedDataTypes.js"
import { JsonBookingType, JsonEventType, JsonParticipantType, BookingType } from "../lambda-common/onetable.js"

export function parseDate(date: Date | string | undefined): Date | null {
    if(!date) return null
    if(date instanceof Date) return date
    return parseISO(date)
}

const addComputedFieldToParticipant = (booking, startDate) => (p: JsonParticipantType): JsonParticipantWithExtraType => {
    const dateOfBirth = parseDate(p.basic.dob)
    const age = differenceInYears(startDate, dateOfBirth!)
    return {...p, dob: dateOfBirth!, age, ageGroup: getAgeGroup(age), booking}
}

export function addComputedFieldsToBookingsQueryResult(bookings: JsonBookingType[] | BookingType[], event: JsonEventType): JsonBookingWithExtraType[] {
    const startDate = parseDate(event.startDate)!
    return bookings.map(b => {
        return {...b, participants: b.participants.map(addComputedFieldToParticipant(b, startDate))}
    }) as [JsonBookingWithExtraType]
}


export function getMemoUpdateFunctions(update) {
    return React.useMemo(() => ({
        updateField: field => e => {
            update(data => ({ ...data, [field]: e.target.value }))
            e.preventDefault()
        },
        updateDate:  field => e => {
            update(data => ({ ...data, [field]: e}))
        },
        updateSwitch: field => e => {
            update(data => ({ ...data, [field]: e.target.checked }))
        },
        updateNumber: field => e => {
            update(data => ({ ...data, [field]: parseInt(e.target.value) }))
            e.preventDefault()
        },
        addEmptyObjectToArray: e => {
            update((data = []) => ([...data, {}]))
        },
        setArrayItem: i => {
            return e => {
                update((data: any[] = []) => {
                    const newData = [...data]
                    newData[i] = e.target.value
                    return newData
                })
                e.preventDefault()
            }
        },
        setArrayItemFilter: i => {
            return e => {
                update((data: any[] = []) => {
                    const newData = [...data]
                    newData[i] = e.target.value
                    return newData.filter(x => x)
                })
                e.preventDefault()
            }
        },
        setArrayRadio: i => {
            return value => {
                update((data: any[] = []) => {
                    const newData = [...data]
                    newData[i] = value
                    return newData
                })
            }
        },
        updateArrayItem: i => {
            return subdataFunction => {
                update((data: any[] = []) => {
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
                update((data = {}) => ({...data, [subfield]: subdataFunction(data[subfield])}))
            }
        },
    }), [])
}

export const capitalizeWord = (word: string = "") => {
    return word.charAt(0).toUpperCase() + word.slice(1);
}