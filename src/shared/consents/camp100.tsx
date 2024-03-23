import React from "react";
import { JsonParticipantType } from "../../lambda-common/onetable.js";
import { ConsentStructure, ConsentValidationResults } from "./consents_class.js";
import { PartialDeep } from "type-fest";
import { Box, FormControlLabel, FormLabel, Grid, Radio, RadioGroup } from "@mui/material";
import { getMemoUpdateFunctions } from "../util.js";
import { DataManager } from "discord.js";

export class Camp100 implements ConsentStructure {
    consentName = "Camp100"
    ParticipantFormElement({ data = {}, update }: { data: PartialDeep<Required<JsonParticipantType>["consent"]>, update: any }) {

        const updateRadio = consent => e => {
            update(consentData => ({ ...consentData, [consent]: e.target.value === "yes" ? true : e.target.value === "no" ? false : undefined }))
            e.preventDefault()
        }

        return <>
            <Grid container spacing={2} sx={{mt:1}}>
                <Grid item xs>
                    <Box pt={1}>
                        <FormLabel id={`consent-photo-label`} radioGroup={`consent-photo`}>PHOTO WORDING - lorium ipslore blah blah blah yes please don't spent ages blurring my little darling out of the news afterwards, etc etc</FormLabel>
                    </Box>
                </Grid><Grid item>
                    <RadioGroup
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
            <Grid container spacing={2}>
                <Grid item xs>
                    <Box pt={1}>
                        <FormLabel id={`consent-sre-label`} radioGroup={`consent-sre`}>SRE WORDING - yes they can go in the mested up tent lets be honest those we dont get this for usually need it the most</FormLabel>
                    </Box>
                </Grid><Grid item>
                    <RadioGroup
                        row
                        aria-labelledby={`consent-sre-label`}
                        name={`consent-sre`}
                        value={data.sre === true ? "yes" : data.sre === false ? "no" : ""}
                        onChange={updateRadio('sre')}>
                        <FormControlLabel value="yes" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="No" />
                    </RadioGroup>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs>
                    <Box pt={1}>
                        <FormLabel id={`consent-activities-label`} radioGroup={`consent-activities`}>ACTIVITIES WORDING - yes little Tristram can swim, etc this is the one we don't need right?</FormLabel>
                    </Box>
                </Grid><Grid item>
                    <RadioGroup
                        row
                        aria-labelledby={`consent-activities-label`}
                        name={`consent-activities`}
                        value={data.activities === true ? "yes" : data.activities === false ? "no" : ""}
                        onChange={updateRadio('activities')}>
                        <FormControlLabel value="yes" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 18, } }} />} label="No" />
                    </RadioGroup>
                </Grid>
            </Grid>
        </>
    }

    public validate(participant: Partial<JsonParticipantType>): ConsentValidationResults {
        const results: ConsentValidationResults = []
        if (participant.basic?.name) {
            if (typeof participant.consent?.photo !== "boolean") results.push(`Please answer photo consent for ${participant.basic?.name}`)
            if (typeof participant.consent?.sre !== "boolean") results.push(`Please answer SRE consent for ${participant.basic?.name}`)
            if (typeof participant.consent?.activities !== "boolean") results.push(`Please answer activities consent for ${participant.basic?.name}`)
        }
        return results
    }
}