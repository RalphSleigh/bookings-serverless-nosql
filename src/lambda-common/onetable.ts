import { Dynamo } from 'dynamodb-onetable/Dynamo'
import { Table, Entity } from 'dynamodb-onetable'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Jsonify } from 'type-fest'

const client = new Dynamo({
    client: new DynamoDBClient({
        region: 'eu-west-2',
    })
})

const schema = {
    format: 'onetable:1.1.0',
    version: '0.0.1',
    indexes: {
        primary: { hash: 'pk', sort: 'sk' },
        ls1: { type: 'local', sort: 'userIdVersion', project: 'all' }
    },
    models: {
        User: {
            pk: { type: String, value: 'user:${remoteId}' },
            sk: { type: String, value: 'user' },
            id: { type: String, generate: 'uid', required: true },
            remoteId: { type: String, required: true },
            userName: { type: String, required: true },
            password: { type: String },
            email: { type: String },
            source: { type: String },
            picture: { type: String },
            admin: { type: Boolean, required: true, default: 'false' },
            created: { type: Date },
            updated: { type: Date },
        },
        Role: {
            pk: { type: String, value: 'role' },
            sk: { type: String, value: '${eventid}:${id}' },
            userIdVersion: { type: String, value: '${userId}:${id}' },
            id: { type: String, generate: 'uid', required: true },
            userId: { type: String, required: true },
            eventId: { type: String, required: true },
            created: { type: Date },
            updated: { type: Date },
        },
        Event: {
            pk: { type: String, value: 'event' },
            sk: { type: String, value: 'details:${id}' },
            id: { type: String, generate: 'uid', required: true },
            owner: { type: String, required: true },
            name: { type: String, required: true },
            description: { type: String },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            bookingDeadline: { type: Date, required: true },
            kpMode: {type: String, required: true, enum:['basic', 'vcamp']},
            bigCampMode: { type: Boolean, required: true, default: 'false' },
            feeStructure: { type: String, required: true },
            created: { type: Date },
            updated: { type: Date },
        },
        Booking: {
            pk: { type: String, value: 'booking' },
            sk: { type: String, value: 'event:${eventId}:version:${version}:user:${userId}' },
            userIdVersion: { type: String, value: '${userId}:${version}' },
            version: { type: String, required: true },
            deleted: { type: Boolean, required: true },
            userId: { type: String, required: true },
            eventId: { type: String, required: true },
            contactName: { type: String, required: true },
            participants: {
                type: Array, items: {
                    type: Object,
                    schema: {
                        basic: {
                            type: Object,
                            //Currently unsupported
                            //schema: {
                            //    name: { type: String, required: true }
                            //},
                            required: true
                        },
                        kp: {
                            type: Object,
                            //Currently unsupported
                            //schema: {
                            //    name: { type: String, required: true }
                            //},
                        },
                        created: { type: Date, required: true },
                        updated: { type: Date, required: true }
                    }

                },
                required: true
            },
            created: { type: Date, required: true },
            updated: { type: Date, required: true },
        },
        EventBookingTimeline: {
            pk: { type: String, value: 'eventbookingtimeline' },
            sk: { type: String, value: 'event:${eventId}' },
            eventId: { type: String, required: true },
            events: {
                type: Array,
                items: {
                    type: Object,
                    schema: {
                        userId: { type: String, required: true },
                        time: { type: Date, required: true }
                    }
                },
            },
            created: { type: Date },
            updated: { type: Date },
        }
    } as const,
    params: {
        isoDates: true,
        timestamps: true,
    },
}

interface ParticipantFields {
    created: Date,
    updated: Date
}

interface ParticipantBasicType {
    basic: {
        name: string
    }
}

interface ParticipantKpType {
    kp: {
        diet: "omnivore" | "pescatarian" | "vegetarian" | "vegan"
    }
}

export type ParticipantType = ParticipantFields & ParticipantBasicType & Partial<ParticipantKpType>

export type JsonParticipantType = Jsonify<ParticipantFields> & ParticipantBasicType & Partial<ParticipantKpType>

export type UserType = Entity<typeof schema.models.User>
export type EventType = Entity<typeof schema.models.Event>
export type RoleType = Entity<typeof schema.models.Role>

export type FoundUserResponseType = (UserType & { roles: Array<RoleType> })
export type UserResponseType = FoundUserResponseType | null

export type OnetableBookingType = Entity<typeof schema.models.Booking>

export type BookingType = Omit<OnetableBookingType, 'participants'> & {participants: Array<ParticipantType>}
export type EventBookingTimelineType = Entity<typeof schema.models.EventBookingTimeline>

export type JsonUserType = Jsonify<UserType>
export type JsonUserResponseType = Jsonify<UserResponseType>
export type JsonEventType = Jsonify<EventType>
export type JsonBookingType = Omit<Jsonify<BookingType>, 'participants'> & {participants: Array<JsonParticipantType>}
export type JsonEventBookingTimelineType = Jsonify<EventBookingTimelineType>
export type JsonRoleType = Jsonify<RoleType>





//@ts-ignore
export const table = new Table({
    client: client,
    name: 'Bookings',
    schema: schema,
    partial: true
})

