import { Grid, TextField, Typography } from "@mui/material"
import { JsonBookingType } from "../../../lambda-common/onetable.js"
import React from "react"
import { getMemoUpdateFunctions } from "../../../shared/util.js"
import { PartialDeep } from "type-fest"

let key = 1

function bookingExtraContactFields({ data, update }: { data: PartialDeep<JsonBookingType>["extraContacts"], update: any }) {

    const { updateArrayItem } = getMemoUpdateFunctions(update('extraContacts'))

    const contacts = (Array.isArray(data) ? [...data, {}] : [{}] ).map((d, i) => {
        return <ExtraContactPerson key={i} i={i} data={d} update={updateArrayItem(i)} last={!Array.isArray(data) || i == data.length} />
    })

    return <>
        <Typography variant="h6" sx={{ mt: 2 }}>Extra Contacts</Typography>
        <Typography variant="body1">Here you can supply contact details for additional people we can contact about your booking, this is optional but may be useful.</Typography>
        {contacts}
    </>
}


const ExtraContactPerson = ({ i, data, update, last }: { i: number, data: Partial<NonNullable<JsonBookingType["extraContacts"]>[0]>, update: any, last: boolean }) => {

    if (!data.email && !data.name && !last) return null

    const { updateField } = getMemoUpdateFunctions(update)

    return <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
            <TextField
                autoComplete={`extra-contact-${i} name`} 
                name={`extra-contact-name-${i}`} 
                id={`extra-contact-name-${i}`} 
                inputProps={{'data-form-type': 'other'}} 
                fullWidth
                label="Name"
                value={data?.name || ''}
                onChange={updateField('name')} />
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField
                autoComplete={`extra-contact-${i} email`} 
                fullWidth
                name={`extra-contact-email-${i}`} 
                id={`extra-contact-email-${i}`}
                inputProps={{'data-form-type': 'other'}} 
                type="email"
                label="Email"
                value={data?.email || ''}
                onChange={updateField('email')} />
        </Grid>
    </Grid>

}

export const MemoBookingExtraContactFields = React.memo(bookingExtraContactFields)
