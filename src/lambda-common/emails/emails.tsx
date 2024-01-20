import { BookingConfirmationEmail } from "./bookingConfirmation.js";
import { BookingEditedEmail } from "./bookingEdited.js";

const emails = {
    confirmation: new BookingConfirmationEmail(),
    edited: new BookingEditedEmail()
}

export type emails = typeof emails

export function getEmailTemplate(name: keyof emails) {
    return emails[name]
}