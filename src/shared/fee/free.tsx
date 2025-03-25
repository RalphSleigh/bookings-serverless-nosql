import { InputAdornment, TextField, Typography } from "@mui/material";
import { FeeLine, FeeStructure } from "./feeStructure.js";
import React from "react";
import { WholeAttendance } from "../attendance/whole.js";
import { BookingType, EalingFeeEventType, EventType, JsonBookingType, JsonEventType } from "../../lambda-common/onetable.js";
import { PartialDeep } from "type-fest";

export class Free extends FeeStructure {
    public feeName = "Free"
    public hasPaymentReference = false;
    public supportedAttendanceStructures = [WholeAttendance]

    public ConfigurationElement = (props) => {
        return <>
            <Typography sx={{ mt: 2 }} variant="h5">No Options</Typography>
        </>
    }

    public StripeElement = ({ event, booking }: { event: JsonEventType, booking: JsonBookingType }) => {
        return null
    }

    public getFeeLines = (event: JsonEventType | EventType, booking: PartialDeep<JsonBookingType> | BookingType): FeeLine[] => {
        return []
    }

    public DescriptionElement = ({ event, booking }: { event: JsonEventType, booking: PartialDeep<JsonBookingType> }) => {
        return <Typography variant="body1">Its Free</Typography>
    }

    public EmailElement = ({ event, booking }: { event: EventType, booking: BookingType }) => {
        return (<p>Its Free</p>)
    }

    public getValueLabels = () => ([])

    public getPaymentReference(booking: (PartialDeep<JsonBookingType> | BookingType) & { userId: string }) {
        return ""
    }
}