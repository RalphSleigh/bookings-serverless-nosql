import { BookingConfirmationEmail } from "./bookingConfirmation.js";
import { BookingEditedEmail } from "./bookingEdited.js";
import { ManagerConfirmationEmail } from "./managerBookingCreated.js";
import { ManagerBookingDeletedEmail } from "./managerBookingDeleted.js";
import { ManagerBookingUpdatedEmail } from "./managerBookingUpdated.js";
import { ManagerDataAccessEmail } from "./managerDataAccess.js";

const emails = {
    confirmation: new BookingConfirmationEmail(),
    edited: new BookingEditedEmail(),
    //deleted: new BookingDeletedEmail(),
    managerConfirmation: new ManagerConfirmationEmail(),
    managerBookingUpdated: new ManagerBookingUpdatedEmail(),
    managerBookingCancelled: new ManagerBookingDeletedEmail(),
    managerDataAccess: new ManagerDataAccessEmail()
}

export type EmailsType = typeof emails

export function getEmailTemplate<T extends keyof EmailsType>(name: T): EmailsType[T] {
    return emails[name]
}