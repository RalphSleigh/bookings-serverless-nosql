import { BookingEmailData, EmailData } from "../email.js"
import { EmailTemplate } from "./emailTemplate.js"
import * as React from 'react';
import { Button } from '@react-email/button';
import { Hr } from '@react-email/hr';
import { Html, Text, Link } from '@react-email/components';
import { getFee } from "../../shared/fee/fee.js";
import { ConfigType } from "../config.js";
import { getLoginReminderText } from "./emailsUtils.js";

export class ApplicationApprovedEmail extends EmailTemplate {
    subject(data: BookingEmailData) {
        return `Application approved for ${data.event.name}`
    }

    HTLMBody(data: BookingEmailData, config: ConfigType) {

        const loginReminder = getLoginReminderText(data)

        return (<Html lang="en">
            <Text>Hi {data.recipient.userName}</Text>
            <Text>You have been approved to book into {data.event.name} and can do so at any time here:</Text>
            <Text>
                <Link href={config.BASE_URL}>{config.BASE_URL}</Link>
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