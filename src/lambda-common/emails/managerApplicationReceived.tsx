import { BookingEmailData, EmailData } from "../email.js"
import { EmailTemplate } from "./emailTemplate.js"
import * as React from 'react';
import { Html, Text, Link } from '@react-email/components';
import { ConfigType } from "../config.js";

export class ManagerApplicationReceivedEmail extends EmailTemplate {
    subject(data: BookingEmailData) {
        return `[${data.event.emailSubjectTag}] Application Added`
    }

    HTLMBody(data: BookingEmailData, config: ConfigType) {
        return (<Html lang="en">
            <Text>Hi {data.recipient.userName}</Text>
            <Text>{data.bookingOwner.userName} has applied to book for {data.event.name}.
                You should log on to to check their application, and badger Ralph to make this e-mail more useful
                with info and links you can just click to approve.</Text>
            <Text>
                <p>Blue Skies and Friendship,</p>
                <p>Woodcraft Folk</p>
            </Text>
        </Html>)
    }
}