import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import { BookingType, table } from '../../lambda-common/onetable.js';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {
        if(!current_user) return { bookings: [] };
        const BookingModel = table.getModel<BookingType>('Booking')
        const bookings = await BookingModel.find({userIdVersion: `${current_user.id}:latest`}, {index: 'ls1'})
        return { bookings };
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