import { BookingEmailData, EmailData } from "../email.js"
import { EmailTemplate } from "./emailTemplate.js"
import * as React from 'react';
import { Button } from '@react-email/button';
import { Hr } from '@react-email/hr';
import { Html, Text, Link } from '@react-email/components';
import { getFee } from "../../shared/fee/fee.js";
import { ConfigType } from "../config.js";
import { getLoginReminderText } from "./emailsUtils.js";
import { JsonBookingType } from "../onetable.js";

export class BookingConfirmationEmail extends EmailTemplate {
    subject(data: BookingEmailData) {
        return `Booking confirmation for ${data.event.name}`
    }

    HTLMBody(data: BookingEmailData, config: ConfigType) {

        const loginReminder = getLoginReminderText(data)

        const editLink = `${config.BASE_URL}event/${data.event.id}/edit-my-booking`

        const participantsList = data.booking.participants.map((p, i) => <li key={i} style={{ fontSize: "14px" }}>{p.basic.name}</li>);

        const fees = getFee(data.event)


        if (data.event.bigCampMode) {

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
                <Text>
                    <b>THIS IS YOUR INVOICE</b>
                </Text>
                <Text>
                    <b>DATE OF ISSUE: {new Date().toLocaleDateString()}</b>
                </Text>
                <Text>
                    <fees.EmailElement event={data.event} booking={data.booking} />
                </Text>
                <Text>
                    <b>Please pay by bank transfer where possible </b>
                </Text>
                <Text>
                    <b>Your payment reference is {fees.getPaymentReference(data.booking)}. You must use this reference with all payments. That is how we are able to identify your booking and reduce your outstanding balance.</b>
                </Text>
                <Text>
                    <b>We strongly encourage that groups pay camp fees by bank transfer where possible.</b>
                    Please transfer all payments into the following account <br />
                    Account name: Woodcraft Folk <br />
                    Account number: 2039 2756<br />
                    Sort code: 60 83 01

                </Text>
                <Text>
                    If for any reason you cannot add a reference, please send an email to info@camp100.org.uk and let us know how much you paid, when you paid it and who it was for so we can match up payments.
                </Text>
                <Text>
                    <b>International bank transfer: <br />
                        IBAN Number: GB93NWBK60023571418024 <br />
                        Swift Code (BIC): NWBKGB2L
                    </b>
                </Text>
                <Text>
                    <b>Cheques</b><br />
                    If you cannot complete the payment via BACS you can send a cheque:<br />
                    Please make all cheques payable to Woodcraft Folk<br />
                    If you are paying by cheque please email <Link href={"mailto:info@camp100.org.uk"}>info@camp100.org.uk</Link> to let us know you have sent the cheque and who it is paying for.
                </Text>
                <Text>
                    Post your cheque to:<br />
                    Woodcraft Folk<br />
                    Holyoake House<br />
                    Hanover Street<br />
                    Manchester <br />
                    M60 0AS
                </Text>
                <Text>
                    <b>For any questions contact the Camp 100 team on <Link href={"mailto:info@camp100.org.uk"}>info@camp100.org.uk</Link> or +44 (0)7422966127</b>
                </Text>
            </Html>)

        } else {

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
}