import { EmailData } from "../email.js"
import { EmailTemplate } from "./emailTemplate.js"
import * as React from 'react';
import { Html, Text, Link } from '@react-email/components';
import { ConfigType } from "../config.js";

export class ManagerBookingDeletedEmail extends EmailTemplate {
    subject(data: EmailData) {
        return `[${data.event.emailSubjectTag}] Booking Cancelled`
    }

    HTLMBody(data: EmailData, config: ConfigType) {
        const participantsList = data.booking.participants.map((p, i) => <li key={i} style={{ fontSize: "14px" }}>{p.basic.name}</li>);

        return (<Html lang="en">
            <Text>Hi {data.recipient.userName}</Text>
            <Text>{data.bookingOwner.userName} has cancelled their booking to {data.event.name}. They had previously
                booked {data.booking.participants.length} {data.booking.participants.length === 1 ? 'person' : 'people'}</Text>
            <ul>{participantsList}</ul>
            <Text>
                <p>Blue Skies and Friendship,</p>
                <p>Woodcraft Folk</p>
            </Text>
        </Html>)
    }
}