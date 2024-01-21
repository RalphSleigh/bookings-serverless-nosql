import { isPast } from "date-fns";
import { BookingType, OnetableEventType, JsonBookingType, JsonEventType, JsonUserResponseType, UserResponseType, UserType, EventType, RoleType } from "../lambda-common/onetable.js";
import { parseDate } from "./util.js";

type PermissionData = {
    user?: NonNullable<UserResponseType | JsonUserResponseType>
    event?: OnetableEventType | JsonEventType
    booking?: BookingType | JsonBookingType
}

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export class PermissionError extends Error { }

export class Permission {
    func: (data: PermissionData) => Boolean;
    message: string;
    constructor(permissionFunc: (data: PermissionData) => Boolean, message: string) {
        this.func = permissionFunc
        this.message = message
    }

    throw(data: PermissionData) {
        if (!this.func(data)) throw new PermissionError(this.message)
    }

    if(data: PermissionData): Boolean {
        try {
            return this.func(data)
        } catch (e) {
            return false
        }
    }
}

export class LoggedInPermission<T extends keyof PermissionData = "user"> {
    func: (data: PartiallyRequired<PermissionData, "user" | T>) => Boolean;
    message: string;
    constructor(permissionFunc: (data: PartiallyRequired<PermissionData, "user" | T>) => Boolean, message: string) {
        this.func = permissionFunc
        this.message = message
    }

    throw(data: PartiallyRequired<PermissionData, "user" | T>) {
        IsLoggedIn.throw(data)
        if (!this.func(data)) throw new PermissionError(this.message)
    }

    if(data: PartiallyRequired<PermissionData, "user" | T>): Boolean {
        try {
            return IsLoggedIn.if(data) && this.func(data)
        } catch (e) {
            return false
        }
    }
}

export const IsLoggedIn = new Permission(data => {
    return data.user !== null
}, "User must be logged in")

export const CanEditUser = new LoggedInPermission(data => {
    return !data.user!.isWoodcraft
}, "User can't edit user")

export const IsGlobalAdmin = new LoggedInPermission(data => {
    return IsLoggedIn.if(data) && data.user!.admin
}, "User must be an admin")

export const CanEditEvent = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    return false
}, "User can't edit event")

export const CanManageEvent = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    if (hasRoleOnEvent(data.user, data.event, ["Owner", "Manage", "View", "Money", "KP"])) return true
    return false
}, "User can't manage event")

export const CanManageWholeEvent = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    if (hasRoleOnEvent(data.user, data.event, ["Owner", "Manage"])) return true
    return false
}, "User can't manage whole event")

export const CanCreateRole = new LoggedInPermission<"event">(data => {
    return CanManageWholeEvent.if(data)
}, "User can't create role")

export const CanDeleteRole = new LoggedInPermission<"event">(data => {
    return CanManageWholeEvent.if(data)
}, "User can't delete role")

export const CanBookIntoEvent = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    if (isPast(parseDate(data.event.bookingDeadline)!)) return false
    return true
}, "User can't book into event")

export const CanEditOwnBooking = new LoggedInPermission<"event" | "booking">(data => {
    if (IsGlobalAdmin.if(data)) return true
    return data.booking.userId === data.user!.id
}, "User can't edit their booking")

export const CanEditBooking = new LoggedInPermission<"event" | "booking">(data => {
    if (IsGlobalAdmin.if(data)) return true
    if (CanEditOwnBooking.if(data)) return true
    return CanManageEvent.if(data)
}, "User can't edit booking")

export const CanDeleteBooking = new LoggedInPermission<"event" | "booking">(data => {
    if (IsGlobalAdmin.if(data)) return true
    if (CanEditOwnBooking.if(data)) return true
    return CanManageWholeEvent.if(data)
}, "User can't delete booking")

const hasRoleOnEvent = (user: NonNullable<UserResponseType | JsonUserResponseType>, event: OnetableEventType | JsonEventType, roles: Array<RoleType["role"]>) => {
    return roles.find(role => ((user.roles as Array<RoleType>).find(r => r.eventId === event.id && r.role === role)))
}
