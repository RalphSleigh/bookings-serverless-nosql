import { lambda_wrapper_json } from '../../../lambda-common/lambda_wrappers.js';
import { BookingType, EventType, table } from '../../../lambda-common/onetable.js';
import { filterDataByRoles } from '../../../lambda-common/roles.js';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const EventModel = table.getModel<EventType>('Event')
const BookingModel = table.getModel<BookingType>('Booking')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        const event = await EventModel.get({ id: lambda_event.pathParameters?.id })
        const bookings = await BookingModel.find({ sk: { begins: `event:${lambda_event.pathParameters?.id}` } }) as [BookingType]
        //ts-ignore
        const filteredBookings = filterDataByRoles(event, bookings, current_user!)
        const countPerUser = filteredBookings.reduce((acc, b) => {
            if (b.deleted) return acc
            const userId = b.userId
            if (!acc[userId]) acc[userId] = 1
            acc[userId] += 1
            return acc
        },{} as Record<string, number>)
        const timelineBookings = filteredBookings
        .filter(b => b.version !== "latest")
        .sort((a, b) => Date.parse(b.version) - Date.parse(a.version))
        if(timelineBookings.length === 0) return { participantTotals: [] }
        const earliestBooking = timelineBookings[timelineBookings.length - 1]
        const latestBooking = timelineBookings[0]
        const participantTotals: { day: Date, total: number }[] = []
        for (let i = Date.parse(earliestBooking.version); i <= Date.parse(latestBooking.version) + 24 * 60 * 60 * 1000; i += 24 * 60 * 60 * 1000) {
            const day = new Date(i)
            const bookingsBeforeTimestamp = timelineBookings.filter(b => Date.parse(b.version) <= day.getTime())
            const seenUsers = new Set()
            const latestBookingsBeforeTimestamp = bookingsBeforeTimestamp.filter(b => {
                if (seenUsers.has(b.userId)) return false
                seenUsers.add(b.userId)
                return true
            })
            participantTotals.push({ day, total: latestBookingsBeforeTimestamp.filter(b=> !b.deleted).reduce((acc, b) => acc + b.participants.length, 0) })
        }
        return { participantTotals, countPerUser };
    }
)
