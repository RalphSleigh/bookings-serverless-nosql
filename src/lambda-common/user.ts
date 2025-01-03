import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { log } from './logging.js'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import { RoleType, table, UserResponseType, UserType, FoundUserResponseType, ApplicationType } from './onetable.js'
import { useGridRowSelection } from '@mui/x-data-grid/internals'
import { admin, auth } from '@googleapis/admin'

const UserModel = table.getModel<UserType>('User')
const RoleModel = table.getModel<RoleType>('Role')
const ApplicationModel = table.getModel<ApplicationType>('Application')

export async function get_user_from_event(event: APIGatewayProxyEvent, config): Promise<UserResponseType> {
    try {

        const cookie_string = event.headers["Cookie"] || event.headers["cookie"]

        if (!cookie_string) throw "no cookie"

        const jwt_string = cookie.parse(cookie_string)?.jwt

        if (jwt_string === "") return undefined

        const token = jwt.verify(jwt_string, config.JWT_SECRET) as { remoteId: string }

        const user = await UserModel.get({ remoteId: token.remoteId }) as UserType | undefined
        if (user) {
            const userResponse: FoundUserResponseType = { ...user, tokens: !!user.tokens, roles: [], applications: [] }
            const [roles, applications] = await Promise.all([RoleModel.find({ userIdVersion: { begins: user?.id } }, { index: 'ls1' }), ApplicationModel.find({ userIdVersion: { begins: user?.id } }, { index: 'ls1' })])
            userResponse.roles = roles
            userResponse.applications = applications
            return userResponse
        } else {
            throw "no user found for ID???"
        }
    } catch (e) {
        console.log(e)
        return undefined
    }
}

export async function get_user_from_login(id: string, source: UserType["source"], config, displayName: string | undefined, picture: string | undefined = undefined, email: string | undefined = undefined): Promise<UserType & { new: boolean }> {
    if (typeof id !== 'string') throw new Error("No ID from provider");
    const combinedId = source + id;
    const UserModel = table.getModel<UserType>('User')
    const user = await UserModel.get({ remoteId: combinedId }) as UserType & { new: boolean } | undefined

    if (user) {
        log(`Found user based on id ${user.remoteId} ${user.userName}`)
        user.new = false
        return user;
    }

    let isWoodcraft = false
    let isisWoodcraftGroupUser = false
    if (source === "google") {
        const auth_client = new auth.JWT(
            config.EMAIL_CLIENT_EMAIL,
            '',
            config.EMAIL_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
            config.EMAIL_FROM
        );

        try {
            const directory = admin({ version: 'directory_v1', auth: auth_client })
            const user = await directory.users.get({
                userKey: id
            })
            isWoodcraft = true
            isisWoodcraftGroupUser = !!user.data.orgUnitPath?.toLocaleLowerCase().includes("groups-and-districts")
            displayName = user.data.name?.fullName ?? displayName
            email = user.data.primaryEmail || undefined
        } catch (e) {
            console.log(e)
        }
    }

    const newUser = await UserModel.create({ remoteId: combinedId, userName: displayName, source: source, picture, admin: config.ENV === "dev" ? isWoodcraft : false, isWoodcraft: isWoodcraft, email: email, isisWoodcraftGroupUser: isisWoodcraftGroupUser }) as UserType & { new: boolean }

    log(`Creating new user ${newUser.userName}`)

    newUser.new = true
    return newUser
}