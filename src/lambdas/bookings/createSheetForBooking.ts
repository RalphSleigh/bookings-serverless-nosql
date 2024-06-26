import { Model } from 'dynamodb-onetable';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { BookingType, OnetableEventType, table } from '../../lambda-common/onetable.js';
import { CanBookIntoEvent } from '../../shared/permissions.js';
import { createSheetForBooking, getHasSheet } from '../../lambda-common/sheets_input.js';
import { user } from '../../lambda-common/index.js';
import { parseAcceptLanguage } from 'intl-parse-accept-language';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const EventModel: Model<OnetableEventType> = table.getModel<OnetableEventType>('Event')

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        if (!current_user) throw new Error("User not found")
        const eventId = lambda_event.pathParameters?.id
        const event = await EventModel.get({ id: eventId })
        if (event == null) throw new Error("Event not found")
        CanBookIntoEvent.throw({ user: current_user, event: event })
        const basicData = lambda_event.body as BookingType["basic"]

        const locales = parseAcceptLanguage(lambda_event.headers["accept-language"], {
            validate: Intl.DateTimeFormat.supportedLocalesOf,
          });


        const sheet = await createSheetForBooking(config, event, current_user, basicData, locales)
        return { sheet: sheet }
    }
)

/*
export const lambdaHandler = lambda_wrapper_json([],
    async (lambda_event, db, config, current_user) => {
        const bookings = await db.booking.findAll({
            where:
            {
                [Op.and]://@ts-ignore
                    [{ userId: { [Op.eq]: current_user.id } },
                    { userId: { [Op.not]: 1 } }
                    ]
            }, include: [{ model: db.participant }, { model: db.payment }]
        })
        return { bookings }
    })
    */