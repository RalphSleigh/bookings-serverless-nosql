import { Participant } from "aws-sdk/clients/chime.js";
import { BookingType, EventType, FoundUserResponseType, ParticipantType, RoleType, UserType } from "./onetable.js";
import { createDateStrForInputFromSections } from "@mui/x-date-pickers/internals";

abstract class RoleFilter {
    role: RoleType;

    constructor(role: RoleType) {
        this.role = role
    }

    abstract filterBooking(bookings: BookingType): Boolean
    abstract filterParticipantFields(participant: ParticipantType): ParticipantType
}

class ViewFilter extends RoleFilter {
    filterBooking(bookings: BookingType): Boolean {
        return true
    }

    filterParticipantFields(participant: ParticipantType) {
            const { basic, created, updated, kp } = participant
            return { basic, created, updated }
    }
}

class NullFilter extends RoleFilter {
    filterBooking(bookings: BookingType): Boolean {
        return false
    }

    filterParticipantFields(participant: ParticipantType) {
            const { basic, created, updated, kp } = participant
            return { basic, created, updated }
    }
}

function getRoleFilter(role: RoleType) {
    switch (role.role) {
        case "view":
            return new ViewFilter(role)
    }

    return new NullFilter(role)
}

export function filterDataByRoles(event: EventType, bookings: BookingType[] = [], user: FoundUserResponseType) {
    if (user.admin) return bookings

    /*
    const bookingsByUser = bookings.reduce<Record<string, BookingType>>((a,c) => {
        return {...a, [c.userId]: c}
    }, {})
*/
    const roles = user.roles.filter(r => r.eventId === event.id).map(r => getRoleFilter(r))

    //if any role allows a booking, allow it
    const filteredBookings = bookings.filter(b => {
        for(const role of roles) {
            if(role.filterBooking(b)) return true
        }
        return false
    })

    //here we want to OR together the various participant fields, IF a booking is allowed by that role.
    filteredBookings.forEach(b => {
        const participants: Array<ParticipantType> = []
        for(const role of roles) {
            if(role.filterBooking(b)) {
                b.participants.forEach((p, i) => {
                    participants[i] = {...role.filterParticipantFields(p), ...participants[i]}
                })
            }
        }
        b.participants = participants
    })

    return filteredBookings
}