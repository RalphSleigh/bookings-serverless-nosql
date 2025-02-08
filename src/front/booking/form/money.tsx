import { Typography } from "@mui/material"
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js"
import React from "react"
import { FeeStructure } from "../../../shared/fee/feeStructure.js"
import { PartialDeep } from "type-fest"

function bookingMoneySection({ fees, event, data, originalData }: { fees: FeeStructure, event: JsonEventType, data: PartialDeep<JsonBookingType>, originalData: PartialDeep<JsonBookingType> }) {
    
    fees.processBookingUpdate(event, originalData, data)
    return <>
        <Typography variant="h6" mt={2}>Pricing</Typography>
        <fees.DescriptionElement event={event} booking={data} originalData={originalData}/>
    </>
}

export const MemoBookingMoneySection = React.memo(bookingMoneySection)