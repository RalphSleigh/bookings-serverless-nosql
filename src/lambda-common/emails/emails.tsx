import { BookingConfirmationEmail } from "./bookingConfirmation.js";

const emails = {
    confirmation: new BookingConfirmationEmail()
}

export type emails = typeof emails

export function getEmailTemplate(name: keyof emails) {
    return emails[name]
}