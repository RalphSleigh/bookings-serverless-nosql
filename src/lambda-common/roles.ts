import _ from "lodash";
import { BookingType, FoundUserResponseType, OnetableEventType, ParticipantType, RoleType, JsonBookingType, UserWithRoles } from "./onetable.js";

abstract class RoleFilter {
    role: RoleType;

    constructor(role: RoleType) {
        this.role = role
    }

    abstract filterBooking(booking: BookingType): Boolean
    abstract filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants">
    abstract filterParticipantFields(participant: ParticipantType): Partial<ParticipantType>
}

class AdminFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        return true
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        return _.cloneDeep(booking)
    }

    filterParticipantFields(participant: ParticipantType) {
        return participant
    }
}

class OwnerFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        return true
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        return _.cloneDeep(booking)
    }

    filterParticipantFields(participant: ParticipantType) {
        return participant
    }
}

class ManageFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        return true
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        return _.cloneDeep(booking)
    }

    filterParticipantFields(participant: ParticipantType) {
        return participant
    }
}

class ViewFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        return true
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        const {fees, ...rest} = booking
        return {...rest} as Partial<T> & Pick<T, "participants">
    }

    filterParticipantFields(participant: ParticipantType) {
        return participant
    }
}

class MoneyFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        return true
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        return _.cloneDeep(booking)
    }

    filterParticipantFields(participant: ParticipantType) {
        const { basic, created, updated, attendance } = participant
        return { basic, created, updated, attendance }
    }
}

class KpFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        return true
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        const {fees, ...rest} = booking
        return {...rest} as Partial<T> & Pick<T, "participants">
    }

    filterParticipantFields(participant: ParticipantType) {
        const { basic, created, updated, kp, attendance } = participant
        return { basic, created, updated, kp, attendance }
    }
}

class CommsFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        return true
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        const {fees, ...rest} = booking
        return {...rest} as Partial<T> & Pick<T, "participants">
    }

    filterParticipantFields(participant: ParticipantType) {
        const { basic, created, updated, attendance } = participant
        return { basic, created, updated, attendance }
    }
}

class AccessibilityFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        return true
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        const {fees, ...rest} = booking
        return {...rest} as Partial<T> & Pick<T, "participants">
    }

    filterParticipantFields(participant: ParticipantType) {
        const { basic, created, updated, attendance, medical } = participant
        return { basic, created, updated, attendance, medical }
    }
}

class VillageViewFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        if(!this.role.village) return false
        return booking.village === this.role.village
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        const {fees, ...rest} = booking
        return {...rest} as Partial<T> & Pick<T, "participants">
    }

    filterParticipantFields(participant: ParticipantType) {
        const { basic, created, updated, attendance, kp, consent, medical } = participant
        return { basic, created, updated, attendance, kp, consent, medical }
    }
}

class NullFilter extends RoleFilter {
    filterBooking(booking: BookingType | JsonBookingType): Boolean {
        return false
    }

    filterBookingFields<T extends BookingType | JsonBookingType>(booking: T): Partial<T> & Pick<T, "participants"> {
        const {fees, ...rest} = booking
        return {...rest} as Partial<T> & Pick<T, "participants">
    }

    filterParticipantFields(participant: ParticipantType) {
        const { basic, created, updated, kp } = participant
        return { basic, created, updated }
    }
}

function getRoleFilter(role: RoleType) {
    switch (role.role) {
        case "Owner":
            return new OwnerFilter(role)
        case "Manage":
            return new ManageFilter(role)
        case "View":
            return new ViewFilter(role)
        case "Money":
            return new MoneyFilter(role)
        case "Comms":
            return new CommsFilter(role)
        case "Accessibility":
            return new AccessibilityFilter(role)
        case "KP":
            return new KpFilter(role)
        case "View - Village":
            return new VillageViewFilter(role)
    }

    return new NullFilter(role)
}

export function filterDataByRoles<T extends BookingType | JsonBookingType>(event: OnetableEventType, bookings: T[] = [], user: FoundUserResponseType | UserWithRoles): T[]  {
    if (user.admin) return bookings

    /*
    const bookingsByUser = bookings.reduce<Record<string, BookingType>>((a,c) => {
        return {...a, [c.userId]: c}
    }, {})
*/
    const roles = user.roles.filter(r => r.eventId === event.id).map(r => getRoleFilter(r))

    //if any role allows a booking, allow it
    const filteredBookings = bookings.filter(b => {
        for (const role of roles) {
            if (role.filterBooking(b)) return true
        }
        return false
    }).map(b => {
        let booking: any = {}
        for (const role of roles) {
            booking = {...role.filterBookingFields(b), ...booking}
        }
        return booking
    })

    //here we want to OR together the various participant fields, IF a booking is allowed by that role.
    filteredBookings.forEach(b => {
        const participants: Array<ParticipantType> = []
        for (const role of roles) {
            if (role.filterBooking(b)) {
                b.participants.forEach((p, i) => {
                    participants[i] = { ...role.filterParticipantFields(p), ...participants[i] }
                })
            }
        }
        b.participants = participants
    })

    return filteredBookings
}