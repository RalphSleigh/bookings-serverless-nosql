import { EmailTemplate  } from "./emailTemplate.js"
import * as React from 'react';
import { Html, Text, Link } from '@react-email/components';
import { ConfigType } from "../config.js";
import { BasicEmailData } from "../email.js";
import { getLoginReminderText } from "./emailsUtils.js";

export class ManagerDataAccessEmail extends EmailTemplate {
    subject(data: BasicEmailData) {
        return `[${data.event.emailSubjectTag}] You have been granted access to data for ${ data.event.name }`
    }

    HTLMBody(data: BasicEmailData, config: ConfigType) {
        const  loginReminder = getLoginReminderText(data)

        return (<Html lang="en">
            <Text>Hi {data.recipient.userName}</Text>
            <Text>You have been granted access to bookings data for {data.event.name}, to view it please log in and choose the "manage" link in bottom corner of the event card.</Text>
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