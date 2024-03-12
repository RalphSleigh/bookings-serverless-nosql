import { BookingEmailData, EmailData } from "../email.js"
import { EmailTemplate } from "./emailTemplate.js"
import * as React from 'react';
import { Button } from '@react-email/button';
import { Hr } from '@react-email/hr';
import { Html, Text, Link } from '@react-email/components';
import { getFee } from "../../shared/fee/fee.js";
import { ConfigType } from "../config.js";
import { getLoginReminderText } from "./emailsUtils.js";

export class BookingEditedEmail extends EmailTemplate {
    subject(data: BookingEmailData) {
        return `Booking updated for ${data.event.name}`
    }

    HTLMBody(data: BookingEmailData, config: ConfigType) {

        const  loginReminder = getLoginReminderText(data)


        const editLink = `${config.BASE_URL}event/${data.event.id}/edit-my-booking`

        const participantsList = data.booking.participants.map((p, i) => <li key={i} style={{ fontSize: "14px" }}>{p.basic.name}</li>);

        const fees = getFee(data.event)

        return (<Html lang="en">
            <Text>Hi {data.recipient.userName}</Text>
            <Text>You have updated your booking for {data.event.name}, You have
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