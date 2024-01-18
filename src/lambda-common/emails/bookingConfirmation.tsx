import { EmailData } from "../email.js"
import { EmailTemplate } from "./emailTemplate.js"
import * as React from 'react';
import { Button } from '@react-email/button';
import { Hr } from '@react-email/hr';
import { Html, Text, Link } from '@react-email/components';
import { getFee } from "../../shared/fee/fee.js";
import { ConfigType } from "../config.js";

export class BookingConfirmationEmail extends EmailTemplate {
    subject(data: EmailData) {
        return `Booking confirmation for ${data.event.name}`
    }

    HTLMBody(data: EmailData, config: ConfigType) {

        let loginReminder = ''
        switch (data.recipient.source) {
            case 'google':
                loginReminder = 'When logging in again make sure to log in with the same account using the Google button'
                break;
            case 'facebook':
                loginReminder = 'When logging in again make sure to log in with the same account using the Facebook button'
                break;
            case 'microsoft':
                loginReminder = 'When logging in again make sure to log in with the same account using the Microsoft button'
                break;
            case 'yahoo':
                loginReminder = 'When logging in again make sure to log in with the same account using the Yahoo button'
                break;
        }

        const editLink = `${config.BASE_URL}/event/${data.event.id}/edit-my-booking`

        const participantsList = data.booking.participants.map((p, i) => <li key={i} style={{ fontSize: "14px" }}>{p.basic.name}</li>);

        const fees = getFee(data.event)

        return (<Html lang="en">
            <Text>Hi {data.recipient.userName}</Text>
            <Text>Thanks for booking for {data.event.name}, You have
                booked {data.booking.participants.length} {data.booking.participants.length === 1 ? 'person' : 'people'}:</Text>
            <ul>{participantsList}</ul>
            <Text>You can come back and edit your booking <Link href={editLink}>here</Link>.</Text>
            <Text>
                <fees.EmailElement event={data.event} booking={data.booking} />
            </Text>
            <Text>
                <p>Blue Skies and Friendship,</p>
                <p>Woodcraft Folk</p>
            </Text>
            <Text>
                <small>{loginReminder}</small>
            </Text>
        </Html>)
    }
}