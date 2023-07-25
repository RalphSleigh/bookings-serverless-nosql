import { isPast } from "date-fns";
import { BookingType, EventType, UserType } from "../lambda-common/onetable.js";
import { parseDate } from "./util.js";
import { Jsonify } from "type-fest";

type PermissionData = {
    user: UserType | undefined
    event?: EventType | Jsonify<EventType>
    booking?: BookingType | Jsonify<BookingType>
}

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type LoggedInPermissionData = PartiallyRequired<PermissionData, "user">
type EventPermissionData = PartiallyRequired<PermissionData, "event">
type BookingPermissionData = PartiallyRequired<PermissionData, "event" | "booking">

export class PermissionError extends Error { }

export class Permission<T> {
    func: (data: T) => Boolean;
    message: string;
    constructor(permissionFunc: (data: T) => Boolean, message: string) {
        this.func = permissionFunc
        this.message = message
    }

    throw(data: T) {
        if (!this.func(data)) throw new PermissionError(this.message)
    }

    if(data: T): Boolean {
        try {
            return this.func(data)
        } catch (e) {
            return false
        }
    }
}

export const IsLoggedIn = new Permission<PermissionData>(data => {
    return data.user !== undefined
}, "User must be logged in")

export const IsGlobalAdmin = new Permission<PermissionData>(data => {
    return IsLoggedIn.if(data) && data.user!.admin
}, "User must be an admin")

export const CanEditEvent = new Permission<EventPermissionData>(data => {
    IsLoggedIn.throw(data)
    if (IsGlobalAdmin.if(data)) return true
    return data.event.owner === data.user!.id
}, "User can't edit event")

export const CanManageEvent = new Permission<EventPermissionData>(data => {
    IsLoggedIn.throw(data)
    if (IsGlobalAdmin.if(data)) return true
    return data.event.owner === data.user!.id
}, "User can't manage event")

export const CanBookIntoEvent = new Permission<EventPermissionData>(data => {
    IsLoggedIn.throw(data)
    if (IsGlobalAdmin.if(data)) return true
    if (isPast(parseDate(data.event.bookingDeadline)!)) return false
    return true
}, "User can't book into event")

export const CanEditOwnBooking = new Permission<BookingPermissionData>(data => {
    IsLoggedIn.throw(data)
    if (IsGlobalAdmin.if(data)) return true
    return data.booking.userId === data.user!.id
}, "User can't edit their booking")

export const CanEditBooking = new Permission<BookingPermissionData>(data => {
    IsLoggedIn.throw(data)
    if (IsGlobalAdmin.if(data)) return true
    if (CanEditOwnBooking.if(data)) return true
    return CanManageEvent.if(data)
}, "User can't edit booking")

