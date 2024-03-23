import { Dynamo } from 'dynamodb-onetable/Dynamo'
import { Table, Entity } from 'dynamodb-onetable'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Jsonify, SetOptional } from 'type-fest'

const client = new Dynamo({
    client: new DynamoDBClient({
        region: 'eu-west-2',
        maxAttempts: 10
    }),
    /*
    marshall: {
        convertClassInstanceToMap: true
    }*/
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
            source: { type: String, required: true, enum: ['google', 'facebook', 'microsoft', 'yahoo', 'apple'] },
            isWoodcraft: { type: Boolean, required: true, default: 'false' },
            admin: { type: Boolean, required: true, default: 'false' },
            userName: { type: String },
            email: { type: String },
            picture: { type: String },
            tokens: { type: Object },
            created: { type: Date },
            updated: { type: Date },
        },
        Role: {
            pk: { type: String, value: 'role' },
            sk: { type: String, value: '${eventId}:${id}' },
            userIdVersion: { type: String, value: '${userId}:${id}' },
            id: { type: String, generate: 'uid', required: true },
            userId: { type: String, required: true },
            eventId: { type: String, required: true },
            role: { type: String, required: true, enum: ['Owner', 'Manage', 'View', 'Money', 'KP', 'Book'] },
            created: { type: Date },
            updated: { type: Date },
        },
        Event: {
            pk: { type: String, value: 'event' },
            sk: { type: String, value: 'details:${id}' },
            id: { type: String, generate: 'uid', required: true },
            name: { type: String, required: true },
            description: { type: String },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            bookingDeadline: { type: Date, required: true },
            replyTo: { type: String, required: true },
            kpMode: { type: String, required: true, enum: ['basic', 'large'] },
            consentMode: { type: String, required: true, enum: ['none', 'camp100'] },
            bigCampMode: { type: Boolean, required: true, default: false },
            applicationsRequired: { type: Boolean, required: true, default: false },
            allParticipantEmails: { type: Boolean, required: true, default: false },
            howDidYouHear: { type: Boolean, required: true, default: false },
            emailSubjectTag: { type: String, required: true },
            attendanceStructure: { type: String, required: true, enum: ['whole', 'options'] },
            attendanceData: {
                type: Object, schema: {
                    options: {
                        type: Array,
                        items: {
                            type: String
                        }
                    }
                },
            },
            feeStructure: { type: String, required: true, enum: ['ealing', 'flat', 'free', 'large'] },
            feeData: {
                type: Object, required: true, schema: {
                    fee: { type: Number },
                    paymentInstructions: { type: String },
                    ealingAccompanied: { type: Number },
                    ealingUnaccompanied: { type: Number },
                    ealingDiscountAccompanied: { type: Number },
                    ealingDiscountUnaccompanied: { type: Number },
                    largeCampBands: {
                        type: Array,
                        items: {
                            type: Object,
                            schema: {
                                before: { type: Date, required: true },
                                description: { type: String, required: true },
                                fees: { type: Array, required: true, items: { type: Number, required: true } }
                            }
                        }
                    }
                }
            },
            customQuestions: {
                required: true,
                type: Array,
                items: {
                    type: Object,
                    schema: {
                        questionType: { type: String, required: true, enum: ['yesnochoice', 'text', 'longtext'] },
                        questionLabel: { type: String, required: true }
                    }
                },
            },
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
            basic: {
                type: Object, required: true, schema: {
                    contactName: { type: String, required: true },
                    contactEmail: { type: String, required: true },
                    contactPhone: { type: String, required: true },
                    bookingType: { type: String, enum: ['individual', 'group'] },
                    district: { type: String },
                    organisation: { type: String },
                    howDidYouHear: { type: String },
                }
            },
            extraContacts: {
                type: Array,
                items: {
                    type: Object,
                    schema: {
                        name: { type: String, required: true },
                        email: { type: String, required: true },
                    }
                }
            },
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
                        attendance: {
                            type: Object,
                            //Currently unsupported
                            //schema: {
                            //    name: { type: String, required: true }
                            //},
                        },
                        kp: {
                            type: Object,
                            //Currently unsupported
                            //schema: {
                            //    name: { type: String, required: true }
                            //},
                        },
                        consent: {
                            type: Object,
                            //Currently unsupported
                            //schema: {
                            //    name: { type: String, required: true }
                            //},
                        },
                        medical: {
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
            emergency: {
                type: Object,
                schema: {
                    name: { type: String, required: true },
                    phone: { type: String, required: true }
                },
            },
            customQuestions: {
                type: Array
            },
            fees: {
                type: Array,
                required: true,
                default: [],
                items: {
                    type: Object,
                    schema: {
                        type: { type: String, required: true, enum: ['payment', 'adjustment'] },
                        value: { type: Number, required: true },
                        userId: { type: String, required: true },
                        description: { type: String, required: true },
                        date: { type: Date, required: true },
                    }
                }
            },
            camping: {
                type: Object,
                schema: {
                    campWith: { type: String },
                    canBringEquipment: { type: String },
                    accessibilityNeeds: { type: String },
                }
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
        },
        Application: {
            pk: { type: String, value: 'application' },
            sk: { type: String, value: 'event:${eventId}:user:${userId}' },
            userIdVersion: { type: String, value: '${userId}' },
            eventId: { type: String, required: true },
            userId: { type: String, required: true },
            bookingType: { type: String, required: true, enum: ['individual', 'group'] },
            name: { type: String, required: true },
            email: { type: String, required: true },
            district: { type: String },
            predictedParticipants: { type: Number, required: true },
            created: { type: Date },
            updated: { type: Date },
        }
    } as const,
    params: {
        isoDates: true,
        timestamps: true,
    },
}

export interface ParticipantAttendanceType {
    option?: string
}

interface ParticipantFields {
    created: Date,
    updated: Date
    attendance: ParticipantAttendanceType
}

interface ParticipantBasicType {
    basic: {
        name: string,
        dob: Date,
        email: string,
    }
}

interface ParticipantKpType {
    kp: {
        diet: "omnivore" | "pescatarian" | "vegetarian" | "vegan",
        details: string,
        nuts: boolean,
        gluten: boolean,
        soya: boolean,
        dairy: boolean,
        egg: boolean,
        pork: boolean,
        chickpea: boolean,
        diabetic: boolean,
        preferences: string,
        contactMe: boolean
    }
}

interface ParticipantMedicalType {
    medical: {
        details: string | undefined
    }
}

interface ParticipantConsentType {
    consent: {
        photo?: Boolean
        sre?: Boolean
        activities?: Boolean
    }
}

export type OnetableEventType = Entity<typeof schema.models.Event>

export interface EalingFeeEventType {
    feeStructure: "ealing"
    feeData: {
        ealingAccompanied: number
        ealingUnaccompanied: number
        ealingDiscountAccompanied: number
        ealingDiscountUnaccompanied: number
        paymentInstructions: string
    }
}

export interface LargeFeeEventType {
    feeStructure: "large"
    feeData: {
        largeCampBands: Array<{
            before: Date
            description: string
            fees: number[]
        }>
    }
}

export interface FlatFeeEventType {
    feeStructure: "flat"
    feeData: {
        fee: number
    }
}

export interface FreeFeeEventType {
    feeStructure: "free"
    feeData: {
    }
}

export type EventType = (OnetableEventType & EalingFeeEventType) | (OnetableEventType & FlatFeeEventType) | (OnetableEventType & FreeFeeEventType) | (OnetableEventType & LargeFeeEventType)
export type JsonEventType = Jsonify<EventType>

export type ParticipantType = ParticipantFields & ParticipantBasicType & Partial<ParticipantKpType> & Partial<ParticipantConsentType> & Partial<ParticipantMedicalType>

export type JsonParticipantType = Jsonify<ParticipantFields> & Jsonify<ParticipantBasicType> & Partial<ParticipantKpType> & Partial<ParticipantConsentType> & Partial<ParticipantMedicalType>

export type JsonParticipantWithBasicType = Partial<Omit<JsonParticipantType, 'basic'>> & Jsonify<ParticipantBasicType>

export type UserType = Entity<typeof schema.models.User>
export type RoleType = Entity<typeof schema.models.Role>

export type UserWithRoles = UserType & { roles: Array<RoleType> }
export type FoundUserResponseType = (Omit<UserType, "tokens"> & { roles: Array<RoleType>, applications: Array<ApplicationType>, tokens: boolean })
export type UserResponseType = FoundUserResponseType | undefined

export type OnetableBookingType = Entity<typeof schema.models.Booking>

export type BookingType = Omit<OnetableBookingType, 'participants'> & { participants: Array<ParticipantType> }
export type EventBookingTimelineType = Entity<typeof schema.models.EventBookingTimeline>

export type JsonUserType = Jsonify<UserType>
export type JsonUserResponseType = Jsonify<UserResponseType>

export type JsonBookingType = Omit<Jsonify<BookingType>, 'participants'> & { participants: Array<JsonParticipantType> }
export type JsonEventBookingTimelineType = Jsonify<EventBookingTimelineType>
export type JsonRoleType = SetOptional<Jsonify<RoleType>, 'id'>

export type ApplicationType = Entity<typeof schema.models.Application>
export type JsonApplicationType = Jsonify<ApplicationType>

//@ts-ignore
export const table = new Table({
    client: client,
    name: 'Bookings',
    schema: schema,
    partial: true
})

