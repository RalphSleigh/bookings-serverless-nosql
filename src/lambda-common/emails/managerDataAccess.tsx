import { EmailTemplate  } from "./emailTemplate.js"
import * as React from 'react';
import { Html, Text, Link } from '@react-email/components';
import { ConfigType } from "../config.js";
import { BasicEmailData } from "../email.js";

export class ManagerDataAccessEmail extends EmailTemplate {
    subject(data: BasicEmailData) {
        return `[${data.event.emailSubjectTag}] You have been granted access to data for ${ data.event.name }`
    }

    HTLMBody(data: BasicEmailData, config: ConfigType) {
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