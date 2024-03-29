import { BookingEmailData, EmailData } from "../email.js"
import { EmailTemplate } from "./emailTemplate.js"
import * as React from 'react';
import { Html, Text, Link } from '@react-email/components';
import { ConfigType } from "../config.js";

export class ManagerConfirmationEmail extends EmailTemplate {
    subject(data: BookingEmailData) {
        return `[${data.event.emailSubjectTag}] Booking Added`
    }

    HTLMBody(data: BookingEmailData, config: ConfigType) {
        const participantsList = data.booking.participants.map((p, i) => <li key={i} style={{ fontSize: "14px" }}>{p.basic.name}</li>);

        return (<Html lang="en">
            <Text>Hi {data.recipient.userName}</Text>
            <Text>{data.bookingOwner.userName} has added a new booking to {data.event.name}. They have
                booked {data.booking.participants.length} {data.booking.participants.length === 1 ? 'person' : 'people'}</Text>
            <ul>{participantsList}</ul>
            <Text>
                <p>Blue Skies and Friendship,</p>
                <p>Woodcraft Folk</p>
            </Text>
        </Html>)
    }
}