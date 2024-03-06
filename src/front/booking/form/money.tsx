import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material"
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js"
import React from "react"
import { FeeStructure } from "../../../shared/fee/feeStructure.js"
import { PartialDeep } from "type-fest"

function bookingMoneySection({ fees, event, data }: { fees: FeeStructure, event: JsonEventType, data: PartialDeep<JsonBookingType> }) {
    return <>
        <Typography variant="h6" mt={2}>Money</Typography>
        <fees.DescriptionElement event={event} booking={data} />
    </>
}

export const MemoBookingMoneySection = React.memo(bookingMoneySection)