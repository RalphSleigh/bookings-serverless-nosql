import React from "react";
import { JsonEventType, JsonParticipantType } from "../../lambda-common/onetable.js";
import { ConsentStructure, ConsentValidationResults } from "./consents_class.js";
import { PartialDeep } from "type-fest";
import { Box, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, Typography } from "@mui/material";
import { parseDate } from "../util.js";
import { differenceInYears } from "date-fns";
import { JsonParticipantWithExtraType } from "../computedDataTypes.js";

export class Camp100 implements ConsentStructure {
    consentName = "Camp100"
    ParticipantFormElement({ data = {}, basic, event, update }: { data: PartialDeep<Required<JsonParticipantType>["consent"]>, basic: PartialDeep<Required<JsonParticipantType>["basic"]>, event: JsonEventType, update: any }) {

        const updateRadio = consent => e => {
            update(consentData => ({ ...consentData, [consent]: e.target.value === "yes" ? true : e.target.value === "no" ? false : undefined }))
            e.preventDefault()
        }

        const ageAtStart = basic.dob ? differenceInYears(parseDate(event.startDate)!, parseDate(basic.dob)!) : 18
        return <>
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs>
                    <Box pt={1}>
                        <FormLabel id={`consent-photo-label`} radioGroup={`consent-photo`}><strong>Image Consent:</strong> I have permission for photos and recordings of this individual to be taken at the event and used by Woodcraft Folk. IFM and other external bodies for publications, social media and during the event on site.</FormLabel>
                    </Box>
                </Grid><Grid item>
                    <RadioGroup
                        sx={{ pt: 1 }}
                        row
                        aria-labelledby={`consent-photo-label`}
                        name={`consent-photo`}
                        value={data.photo === true ? "yes" : data.photo === false ? "no" : ""}
                        onChange={updateRadio('photo')}>
                        <FormControlLabel value="yes" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="No" />
                    </RadioGroup>
                </Grid>
            </Grid>
            {ageAtStart >= 12 && ageAtStart < 18 ?
                <Grid container spacing={2}>
                    <Grid item xs>
                        <Box pt={1}>
                            <FormLabel id={`consent-sre-label`} radioGroup={`consent-sre`}><strong>Relations & Sex Education Consent:</strong> I have permission for this individual to take part in Relationship & Sex Education workshops as part of Camp 100 MEST UP programme. Everyone on camp will take part in a basic consent workshop, this consent is for content above and beyond that. (<a href="https://woodcraft.org.uk/resources/relationship-sex-education-policy/" target="blank">policy</a>)
                            </FormLabel>
                        </Box>
                    </Grid><Grid item>
                        <RadioGroup
                            sx={{ pt: 1 }}
                            row
                            aria-labelledby={`consent-sre-label`}
                            name={`consent-sre`}
                            value={data.sre === true ? "yes" : data.sre === false ? "no" : ""}
                            onChange={updateRadio('sre')}>
                            <FormControlLabel value="yes" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="Yes" />
                            <FormControlLabel value="no" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="No" />
                        </RadioGroup>
                    </Grid>
                </Grid> : <Grid container spacing={2}>
                    <Grid item xs>
                        <Typography sx={{ color: "text.secondary", mt:1}} variant="body2">(RSE consent is only required for those aged 12 - 17)</Typography>
                    </Grid></Grid>}
        </>
    }

    public validate(event, participant: Partial<JsonParticipantType>): ConsentValidationResults {
        const results: ConsentValidationResults = []
        if (participant.basic?.name && participant.basic.dob) {

            const ageAtStart = participant.basic.dob ? differenceInYears(parseDate(event.startDate)!, parseDate(participant.basic.dob)!) : 18

            if (typeof participant.consent?.photo !== "boolean") results.push(`Please answer photo consent for ${participant.basic?.name}`)
            if (ageAtStart >= 12 && ageAtStart < 18 && typeof participant.consent?.sre !== "boolean") results.push(`Please answer RSE consent for ${participant.basic?.name}`)
        }
        return results
    }

    PaticipantCardElement({data}: {data: JsonParticipantWithExtraType}) {
        if(!data.consent) return null

        const noWrap = { whiteSpace: 'nowrap' as 'nowrap', mt: 1 }

        return <>
        <Typography variant="body1" sx={noWrap}><b>Consents</b></Typography>
        <Typography variant="body1">📷{data.consent.photo ? "✔️" : "❌"}</Typography>
        {data.age > 11 && data.age < 18 ? <Typography variant="body1">💑{data.consent.sre ? "✔️" : "❌"}</Typography> : null }
        </>
    }
}