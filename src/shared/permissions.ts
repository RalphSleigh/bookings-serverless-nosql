import { isPast } from "date-fns";
import { BookingType, OnetableEventType, JsonBookingType, JsonEventType, JsonUserResponseType, UserResponseType, UserType, EventType, RoleType, JsonRoleType } from "../lambda-common/onetable.js";
import { parseDate } from "./util.js";

type PermissionData = {
    user?: NonNullable<UserResponseType | JsonUserResponseType>
    event?: OnetableEventType | JsonEventType
    booking?: BookingType | JsonBookingType
    role?: RoleType | JsonRoleType
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

    throw(data: PartiallyRequired<PermissionData, T>) {
        IsLoggedIn.throw(data)
        if (!this.func(data as PartiallyRequired<PermissionData, "user" | T>)) throw new PermissionError(this.message)
    }

    if(data: PartiallyRequired<PermissionData, T>): Boolean {
        try {
            return IsLoggedIn.if(data) && this.func(data as PartiallyRequired<PermissionData, "user" | T>)
        } catch (e) {
            return false
        }
    }
}

export const IsLoggedIn = new Permission(data => {
    return !!data.user
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
    if (hasRoleOnEvent(data.user, data.event, ["Owner", "Manage", "View", "Money", "KP", "Comms"])) return true
    return false
}, "User can't manage event")

export const CanCreateAnyRole = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    return hasRoleOnEvent(data.user, data.event, ["Owner", "Manage"])
}, "User can't create role")

export const CanCreateRole = new LoggedInPermission<"event" | "role">(data => {
    if (IsGlobalAdmin.if(data)) return true
    if (["Owner", "Manage"].includes(data.role.role)) return hasRoleOnEvent(data.user, data.event, ["Owner"])
    return hasRoleOnEvent(data.user, data.event, ["Owner", "Manage"])
}, "User can't create role")

export const CanDeleteRole = new LoggedInPermission<"event" | "role">(data => {
    return CanCreateRole.if(data)
}, "User can't delete role")

export const CanApplyToEvent = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    if (!data.event.applicationsRequired) return false
    if (hasRoleOnEvent(data.user, data.event, ["Book"])) return false
    return true
}, "User can't apply to event")

export const CanBookIntoEvent = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    if (isPast(parseDate(data.event.bookingDeadline)!)) return false
    if (data.event.applicationsRequired) {
        return hasRoleOnEvent(data.user, data.event, ["Book"])
    }
    return true
}, "User can't book into event")

export const CanEditOwnBooking = new LoggedInPermission<"event" | "booking">(data => {
    if (IsGlobalAdmin.if(data)) return true
    return data.booking.userId === data.user!.id
}, "User can't edit their booking")

export const CanEditBooking = new LoggedInPermission<"event" | "booking">(data => {
    if (IsGlobalAdmin.if(data)) return true
    return hasRoleOnEvent(data.user, data.event, ["Owner", "Manage"])
}, "User can't edit booking")

export const CanDeleteOwnBooking = new LoggedInPermission<"event" | "booking">(data => {
    return CanEditOwnBooking.if(data)
}, "User can't delete their booking")

export const CanDeleteBooking = new LoggedInPermission<"event" | "booking">(data => {
    return CanEditBooking.if(data)
}, "User can't delete booking")

export const CanSeeMoneyPage = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    return hasRoleOnEvent(data.user, data.event, ["Owner", "Manage", "View", "Money"])
}, "User can't see money page")

export const CanSeeKPPage = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    return hasRoleOnEvent(data.user, data.event, ["Owner", "Manage", "View", "KP"])
}, "User can't see KP page")

export const CanWriteMoney = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    return hasRoleOnEvent(data.user, data.event, ["Owner", "Manage", "Money"])
}, "User can't manage fees")

export const CanManageApplications = new LoggedInPermission<"event">(data => {
    if (IsGlobalAdmin.if(data)) return true
    return hasRoleOnEvent(data.user, data.event, ["Owner", "Manage"])
}, "User can't manage applications")

const hasRoleOnEvent = (user: NonNullable<UserResponseType | JsonUserResponseType>, event: OnetableEventType | JsonEventType, roles: Array<RoleType["role"]>): Boolean => {
    return !!roles.find(role => ((user.roles as Array<RoleType>).find(r => r.eventId === event.id && r.role === role)))
}
