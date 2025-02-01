import { ApplicationApprovedEmail } from "./applicationApproved.js";
import { ApplicationReceivedEmail } from "./applicationReceived.js";
import { BookingConfirmationEmail } from "./bookingConfirmation.js";
import { BookingEditedEmail } from "./bookingEdited.js";
import { ManagerApplicationReceivedEmail } from "./managerApplicationReceived.js";
import { ManagerConfirmationEmail } from "./managerBookingCreated.js";
import { ManagerBookingDeletedEmail } from "./managerBookingDeleted.js";
import { ManagerBookingUpdatedEmail } from "./managerBookingUpdated.js";
import { ManagerDataAccessEmail } from "./managerDataAccess.js";
import { ManagerManagerBookingEdited } from "./managerManagerBookingEdited.js";

const emails = {
    applicationReceived: new ApplicationReceivedEmail(),
    applicationApproved: new ApplicationApprovedEmail(),
    confirmation: new BookingConfirmationEmail(),
    edited: new BookingEditedEmail(),
    //deleted: new BookingDeletedEmail(),
    managerConfirmation: new ManagerConfirmationEmail(),
    managerBookingUpdated: new ManagerBookingUpdatedEmail(),
    managerBookingCancelled: new ManagerBookingDeletedEmail(),
    managerDataAccess: new ManagerDataAccessEmail(),
    managerApplicationReceived: new ManagerApplicationReceivedEmail(),
    managerManagerBookingEdited: new ManagerManagerBookingEdited()
}

export type EmailsType = typeof emails

export function getEmailTemplate<T extends keyof EmailsType>(name: T): EmailsType[T] {
    return emails[name]
}