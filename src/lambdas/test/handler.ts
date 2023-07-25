import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { table } from '../../lambda-common/onetable'
import bcrypt from 'bcryptjs'

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    try {

        //let User = table.getModel('User')
        /*
        let account = await User.create({
            userName: 'Ralph',               //  OK
            password: bcrypt.hashSync('Hello', bcrypt.genSaltSync()),
            email: 'ralph.sleigh@woodcraft.org.uk',
        })
        */

        //const account = await User.get({userName: "Ralph"})
        
        response = {
            statusCode: 200,
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ user: null })
        };

    } catch (err: unknown) {
        console.log(err);
        response = {
            statusCode: 500,
            body: JSON.stringify({
                message: err instanceof Error ? err.message : 'some error happened',
            }),
        };
    }

    return response;
};