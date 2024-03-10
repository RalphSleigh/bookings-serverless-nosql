import { BookingEmailData, EmailData } from "../email.js"
import { EmailTemplate } from "./emailTemplate.js"
import * as React from 'react';
import { Button } from '@react-email/button';
import { Hr } from '@react-email/hr';
import { Html, Text, Link } from '@react-email/components';
import { getFee } from "../../shared/fee/fee.js";
import { ConfigType } from "../config.js";
import { getLoginReminderText } from "./emailsUtils.js";

export class ApplicationReceivedEmail extends EmailTemplate {
    subject(data: BookingEmailData) {
        return `Application received for ${data.event.name}`
    }

    HTLMBody(data: BookingEmailData, config: ConfigType) {

        const  loginReminder = getLoginReminderText(data)

        return (<Html lang="en">
            <Text>Hi {data.recipient.userName}</Text>
            <Text>Thanks for applying to book for {data.event.name}. One of our team will check your application as soon as
                    possible and you will recieve another e-mail as soon as you are approved to book in.
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