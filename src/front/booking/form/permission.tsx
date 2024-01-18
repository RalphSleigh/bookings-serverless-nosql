import { Box, Checkbox, FormControlLabel, FormGroup, FormLabel, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material"
import { JsonBookingType, JsonEventType } from "../../../lambda-common/onetable.js"
import React from "react"
import { FeeStructure } from "../../../shared/fee/feeStructure.js"
import { getMemoUpdateFunctions } from "../../../shared/util.js"

function bookingPermissionSection({ event, data, update }) {


    const { updateSwitch } = getMemoUpdateFunctions(update)

    return (<>
        <Typography variant="h6" mt={2} mb={2}>Permission</Typography>
        <FormGroup row>
            <FormControlLabel
                sx={{ color: "text.secondary"}}
                control={<Checkbox
                    style={{ alignSelf: 'start'}}
                    sx={{mt: -1}}
                    aria-labelledby={`permission-label`}
                    name={`permission-check`}
                    value={data}
                    onChange={updateSwitch("permission")} />}
                labelPlacement="start"
                label={<>
                    I give permission for the people named above to
                    attend {event.name}.<br /><br />
                    I acknowledge it is my responsibility to ensure everyone over 16 attending has up-to-date
                    Woodcraft Folk membership and completed a DBS check.
                    <br /><br />
                    I agree this information will be stored electronically and shared only with individuals who need this information to
                    engage your child safely in Woodcraft Folk activities. Based on the needs of your child we may also share any relevant
                    information with medical or child protection professionals. For more information please visit
                    <a href="https://woodcraft.org.uk/privacy"> www.woodcraft.org.uk/privacy</a> or contact <a
                        href="mailto:data@woodcraft.org.uk">data@woodcraft.org.uk</a>
                </>} />
        </FormGroup>
    </>)
}

export const MemoBookingPermissionSection = React.memo(bookingPermissionSection)