import React from "react"
import { Typography, Paper, Grid, Modal, Stack, Button, Link } from "@mui/material"
import { parseDate } from "../../shared/util.js"
import { JsonEventType } from "../../lambda-common/onetable.js"
import { JsonBookingWithExtraType } from "../../shared/computedDataTypes.js"
import { fees } from "../../shared/fee/fee.js"
import { CanCreateAnyRole } from "../../shared/permissions.js"
import { IfHasPermission } from "../permissions.js"
import { applicationTypeIcon } from "./utils.js"
import { useCreateRole, useDeleteRole, useEventRoles } from "../queries.js"

export const BookingsModal = ({ event, selectedBooking, booking, handleClose }: { event: JsonEventType, selectedBooking: number | undefined, booking: JsonBookingWithExtraType | undefined, handleClose: () => void }) => {
    if (!booking) return null

    const noWrap = { whiteSpace: 'nowrap' as 'nowrap', mt: 1 }
    const participants = booking.participants.map((p, i) => <li key={i}>{p.basic.name}</li>)

    const customAnswers = event.customQuestions.map((q, i) => <Typography key={i} variant="body1" sx={noWrap}>
        <b>{q.questionLabel}</b><br /> {booking.customQuestions?.[i]?.toString()}
    </Typography>)

    const pastDeadline = parseDate(event.bookingDeadline)!.getTime() < new Date().getTime()

    return (<Modal
        open={selectedBooking !== undefined}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Paper elevation={6} sx={{ p: 2, outline: 'none', maxWidth: "95vw", maxHeight: "95vh", overflowY: "scroll" }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm>
                    <Stack alignItems="center" gap={1} direction="row"><Typography id="modal-modal-title" variant="h6">
                        {booking.basic.contactName}
                    </Typography>
                        {applicationTypeIcon(booking.basic.bookingType)}
                    </Stack>
                    <Typography id="modal-modal-title" variant="subtitle1">
                        {booking.basic.organisation}
                    </Typography>
                    {booking.basic.district ? <Typography id="modal-modal-title" variant="subtitle1">
                        {booking.basic.district}
                    </Typography> : null}
                    <Typography variant="body1" sx={noWrap}>
                        <b>Booked By:</b><br /> {booking.basic.contactName}<br />
                        <a href={`mailto:${booking.basic.contactEmail}`}>{booking.basic.contactEmail}</a><br />
                        <a href={`tel:${booking.basic.contactPhone}`}>{booking.basic.contactPhone}</a>
                    </Typography>
                    {booking.emergency?.name || booking.emergency?.phone ? <Typography variant="body1" sx={noWrap}>
                        <b>Emergency Contact:</b><br /> {booking.emergency?.name}<br />
                        <a href={`tel:${booking.emergency?.phone}`}>{booking.emergency?.phone}</a>
                    </Typography> : null}
                    {event.bigCampMode ? <>
                        <Typography variant="body1" sx={noWrap}>
                            <b>Camp with:</b><br /> {booking.camping?.campWith}
                        </Typography>
                        <Typography variant="body1">
                            <b>Camping Equipment:</b><br /> {booking.camping?.canBringEquipment}
                        </Typography>
                        <Typography variant="body1">
                            <b>Camping Accessibility:</b><br /> {booking.camping?.accessibilityNeeds}
                        </Typography>
                        <Typography variant="body1" sx={noWrap}>
                            <b>How heard:</b><br /> {booking.basic.howDidYouHear}
                        </Typography>
                        <Typography variant="body1">
                            <b>Travel:</b><br /> {booking.camping?.travel}
                        </Typography>
                        <Typography variant="body1" sx={noWrap}>
                            <b>Payment Reference:</b><br /> {fees.large.getPaymentReference(booking)}
                        </Typography>
                    </> : null}
                    {customAnswers}
                    <Link href={`/event/${event.id}/manage/bookings/history/${booking.userId}`}>History</Link>
                </Grid>
                <Grid item xs={12} sm sx={{overflowY: "scroll"}}>
                <Typography variant="body1" sx={noWrap}><b>Attendees: ({booking.participants.length})</b></Typography>
                    <ul>
                        {participants}
                    </ul>
                </Grid>
                {pastDeadline && event.bigCampMode ? <IfHasPermission permission={CanCreateAnyRole} event={event}>
                    <UnlockWidget event={event} booking={booking} />
                </IfHasPermission> : null}
            </Grid>
        </Paper>
    </Modal>)
}

const UnlockWidget = ({ event, booking }: { event: JsonEventType, booking: JsonBookingWithExtraType }) => {
    const createRole = useCreateRole(event.id)
    const deleteRole = useDeleteRole(event.id)
    const roleData = useEventRoles(event.id)

    const haveRole = roleData.data?.roles.find(r => r.userId === booking.userId && r.role === "Amend")

    const unlockOnClick = () => {
        createRole.mutate({ eventId: event.id, userId: booking.userId, role: "Amend" })
    }

    const lockOnClick = () => {
        deleteRole.mutate(haveRole?.id || "" )
    }

    return <Grid item xs={12}>
        {haveRole ? <Button variant="contained" disabled={deleteRole.isPending} onClick={lockOnClick} color="warning">Lock</Button> : <Button variant="contained" disabled={createRole.isPending} onClick={unlockOnClick} color="success">Unlock</Button>}
    </Grid>
}