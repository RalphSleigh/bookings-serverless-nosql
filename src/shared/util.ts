import { differenceInYears, parseISO } from "date-fns"
import React from "react"
import { getAgeGroup } from "./woodcraft.js"
import { JsonBookingWithExtraType, JsonParticipantWithExtraType } from "./computedDataTypes.js"
import { JsonBookingType, JsonEventType, JsonParticipantType, BookingType } from "../lambda-common/onetable.js"
import { diff } from "json-diff-ts"

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
        const newBooking = {...b, town: event.villages?.find(v => v.name === b.village)?.town }
        newBooking.participants = newBooking.participants.map(addComputedFieldToParticipant(newBooking, startDate))
        return newBooking
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

export const generateDiscordDiff: (oldBooking: BookingType, newBooking: BookingType) => string[] = (oldBooking, newBooking) => {

    const replacements = {
        "basic": "Basic",
        "participants": "Campers",
        "bookingType": "Type",
        "emergency": "Emergency Contact",
        "camping": "Camping",
        "travel": "Travel",
        "howDidYouHear": "How did you hear",
        "campsWith": "Camping preference",
        "canBringEquipment": "Camping Equipment",
        "attendance": "Attendance",
        "kp": "Dietary Requirements",
        "medical": "Medical & Accessibility",
        "consent": "Consents",
        "extraContacts": "Extra Contacts",
        "district": "District",
        "contactName": "Contact Name",
        "contactEmail": "Contact Email",
        "contactPhone": "Contact Phone",
        "email": "Email",
        "dob": "Date of Birth",
        "accessibilityNeeds": "Accessibility Needs"
    }

    const updateString = (updateItem, stack) => {
        if (["extraFeeData"].includes(updateItem.key)) return
        if (updateItem.changes) {
            updateItem.changes.forEach(c => {
                updateString(c, [...stack, updateItem])
            })
            return
        }
        if (["version", "created", "updated"].includes(updateItem.key)) return

        const capitalise = (string) => {
            return string[0].toUpperCase() + string.slice(1).toLowerCase()
        }

        let chain = [...stack, updateItem]
        if(chain.length == 4 && chain[0].key == "participants" && chain[2].key !== "basic") {
            updateItem = chain.pop()
        }
        const updateType = typeof (updateItem.value) === "boolean" ? "Update" : capitalise(updateItem.type)
        const string = `${updateType}: ${chain.map(u => replacements[u.key] ? replacements[u.key] : u.key).join(" -> ")}`
        updateStrings.push(string)
    }

    const updateStrings: string[] = []

    const existingLatestBookingDiscord = { ...oldBooking, participants: oldBooking.participants.map(p => ({ ...p, name: p.basic.name, basic: {...p.basic, dob: p.basic.dob instanceof Date ? p.basic.dob.toISOString() : p.basic.dob}})) }
    //@ts-ignore
    const newLatestBookingDiscord = { ...newBooking, participants: newBooking.participants.map(p => ({ ...p, name: p.basic.name, basic: {...p.basic, dob: p.basic.dob instanceof Date ? p.basic.dob.toISOString() : p.basic.dob} })) }

    const updates = diff(existingLatestBookingDiscord, newLatestBookingDiscord, { embeddedObjKeys: { participants: 'name' } })
    updates.forEach(u => {
        updateString(u, [])
    });

    const unquieUpdateStrings = [...new Set(updateStrings)]

    return updates.length > 0 ? unquieUpdateStrings : []

}