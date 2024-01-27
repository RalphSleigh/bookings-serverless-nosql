import { BookingConfirmationEmail } from "./bookingConfirmation.js";
import { BookingEditedEmail } from "./bookingEdited.js";
import { ManagerConfirmationEmail } from "./managerBookingCreated.js";
import { ManagerBookingDeletedEmail } from "./managerBookingDeleted.js";
import { ManagerBookingUpdatedEmail } from "./managerBookingUpdated.js";

const emails = {
    confirmation: new BookingConfirmationEmail(),
    edited: new BookingEditedEmail(),
    //deleted: new BookingDeletedEmail(),
    managerConfirmation: new ManagerConfirmationEmail(),
    managerBookingUpdated: new ManagerBookingUpdatedEmail(),
    managerBookingCancelled: new ManagerBookingDeletedEmail(),
}

export type emails = typeof emails

export function getEmailTemplate(name: keyof emails) {
    return emails[name]
}