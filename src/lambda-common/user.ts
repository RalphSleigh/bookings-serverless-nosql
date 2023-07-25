import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { log } from './logging.js'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import { table, UserType } from './onetable.js'

export async function get_user_from_event(event: APIGatewayProxyEvent, config): Promise<UserType | undefined> {
    try {

        const cookie_string = event.headers["Cookie"] || event.headers["cookie"]

        if(!cookie_string) throw "no cookie"

        const jwt_string = cookie.parse(cookie_string)?.jwt
        const token = jwt.verify(jwt_string, config.JWT_SECRET) as {remoteId: string}
        

        let User = table.getModel<UserType>('User')

        const user = await User.get({remoteId: token.remoteId})

        if(!user) throw "no user found for ID???"
        return user

    } catch (e) {
        console.log(e)
        return undefined
    }
}

export async function get_user_from_login(id: string | undefined | null, displayName: string, source: string) {
    if (typeof id !== 'string') throw new Error("No ID from provider");
    const combinedId = source + id;
    const UserModel = table.getModel<UserType>('User')
    const user = await UserModel.get({remoteId: combinedId})

    if (user) {
        log(`Found user based on id ${user.remoteId} ${user.userName}`)

        if(user.userName !== displayName) {
            await UserModel.update({remoteId: combinedId}, {set:{userName: displayName}})
        }

       return user;
    }

    const newUser = await UserModel.create({ remoteId: combinedId, userName: displayName, source:source})

    log(`Creating new user ${newUser.userName}`)

    return newUser
};

export class WrongProviderError extends Error {
    original: string
    used: string
    constructor(originalProvidor: string, used: string) {
        super();
        this.original = originalProvidor;
        this.used = used;
    }
}