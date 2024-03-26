import { fakerEN_GB as faker } from '@faker-js/faker';
import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, ParticipantType, UserType, table } from '../../lambda-common/onetable.js';
import { Model } from 'dynamodb-onetable';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import am_in_lambda from '../../lambda-common/am_in_lambda.js';
import { Glacier } from 'aws-sdk';

const UserModel: Model<UserType> = table.getModel<UserType>('User')
const EventModel: Model<OnetableEventType> = table.getModel<OnetableEventType>('Event')
const EventBookingTimelineModel: Model<EventBookingTimelineType> = table.getModel<EventBookingTimelineType>('EventBookingTimeline')
const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>('Booking')

const randomCamp100Participant: () => ParticipantType = () => {
    
    const diet = getRandomDiet()
    const complicated = Math.random() < 0.10


    //@ts-ignore
    const participant: ParticipantType = {
        basic: {
            name: faker.person.fullName(),
            dob: faker.date.birthdate({
                min: 3,
                max: 25,
                mode: "age"
            }),
            email: faker.internet.email(),
        },
        attendance: {
            option: getRandomAttendance()
        },
        kp: {
            diet: diet,
            details: complicated ? getRandomDietExtra() : "",
            nuts: complicated && randomBool(0.25),
            gluten: complicated && randomBool(0.25),
            dairy: complicated && randomBool(0.25) || diet == "vegan",
            soya: complicated && randomBool(0.25),
            egg: complicated && randomBool(0.25) || diet == "vegan",
            pork:complicated && randomBool(0.25) || diet != "omnivore",
            chickpea: complicated && randomBool(0.25),
            diabetic: complicated && randomBool(0.25),
            contactMe: complicated && randomBool(0.25),
            preferences: complicated ? getRandomDietPreference() : "",
        },
        medical: {
            details: getRandomMedical(),
        },
        consent: {
            photo: randomBool(0.95),
            sre: randomBool(0.90),
        },

    }

    return participant
}

const camp100Booking = (user, event): OnetableBookingType => {
    //@ts-ignore
    const booking: OnetableBookingType = {
        version: "latest",
        deleted: false,
        userId: user.id,
        eventId: event.id,
        basic: {
            contactName: faker.person.fullName(),
            contactEmail: faker.internet.email(),
            contactPhone: faker.phone.number(),
            district: faker.address.city(),
            organisation: "Woodcraft Folk",
            howDidYouHear: "Website",
        },
        extraContacts: [
            {
                name: faker.person.fullName(),
                email: faker.internet.email(),
            }],
        participants: Array(getRandomInt(1, 40)).fill(0).map(randomCamp100Participant),
        emergency: {
            name: faker.person.fullName(),
            phone: faker.phone.number(),
        },
        customQuestions: [],
        camping: {
            campWith: getRandomCampWith(),
            canBringEquipment: "Yes",
            accessibilityNeeds: "Yes"
        }
    }
    return booking
}

const camp100Event = (): EventType => {
    //@ts-ignore
    const event: EventType = {
        name: "Camp 100",
        description: "This event is a test event for camp 100.",
        startDate: new Date(2025, 6, 27),
        endDate: new Date(2025, 7, 6),
        bookingDeadline: new Date(2025, 6, 1),
        replyTo: "camp100@woodcraft.org.uk",
        kpMode: "large",
        consentMode: "camp100",
        bigCampMode: true,
        applicationsRequired: true,
        allParticipantEmails: true,
        howDidYouHear: true,
        emailSubjectTag: "CAMP100",
        attendanceStructure: "options",
        attendanceData: {
            options: ["Whole camp", "First half", "Second half"]
        },
        feeStructure: "large",
        feeData: {
            largeCampBands: [
                {
                    before: new Date(2025, 7, 13),
                    description: "Very late",
                    fees: [300]
                },
                {
                    before: new Date(2025, 6, 13),
                    description: "Standard",
                    fees: [250]
                }, {
                    before: new Date(2025, 5, 13),
                    description: "Early",
                    fees: [200]
                }
            ]
        },
        customQuestions: [],
    }

    return event
}

const EalingEvent = (): EventType => {
    //@ts-ignore
    const event: EventType = {
        name: "Ealing Camp",
        description: "This event is a test event for Ealing WCF.",
        startDate: new Date(2025, 4, 3),
        endDate: new Date(2025, 4, 6),
        bookingDeadline: new Date(2025, 3, 31),
        replyTo: "ralph.sleigh@woodcraft.org.uk",
        kpMode: "basic",
        consentMode: "none",
        bigCampMode: false,
        applicationsRequired: false,
        allParticipantEmails: false,
        howDidYouHear: false,
        emailSubjectTag: "MAYDAY 2025",
        attendanceStructure: "whole",
        attendanceData: {
        },
        feeStructure: "ealing",
        feeData: {
            ealingAccompanied: 30,
            ealingUnaccompanied: 60,
            ealingDiscountAccompanied: 15,
            ealingDiscountUnaccompanied: 30,
            paymentInstructions: "TODO",
        },
        customQuestions: [{
            questionLabel: "Do you want to be in the WhatsApp group?",
            questionType: "yesnochoice",
        }, {
            questionLabel: "Anything else?",
            questionType: "longtext",
        }]
    }

    return event
}

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {

        const syncPromiose = (async () => {
            const event100 = await EventModel.create(camp100Event())
            const event100newEventBookingTimeline = await EventBookingTimelineModel.create({ eventId: event100.id, events: [] })

            for (let i = 0; i < 100; i++) {
                console.log(`Creating booking ${i}`)
                const user = await UserModel.create({
                    userName: faker.person.fullName(),
                    email: faker.internet.email(),
                    source: "google",
                    remoteId: faker.string.uuid(),
                    isWoodcraft: false,
                    admin: false,
                })

                const booking = camp100Booking(user, event100)
                //@ts-ignore
                updateParticipantsDates([], booking.participants!)
                //@ts-ignore
                const newBooking = await BookingModel.create(booking)
                //create historical version
                newBooking.version = newBooking.created.toISOString()
                //@ts-ignore
                await BookingModel.create(newBooking)

                await EventBookingTimelineModel.update({ eventId: booking.eventId }, {
                    set: { events: 'list_append(if_not_exists(events, @{emptyList}), @{newEvent})' },
                    substitutions: { newEvent: [{ userId: user.id, time: newBooking.created.toISOString() }], emptyList: [] }
                })

                await sleep(1)
            }

            const ealingEvent = await EventModel.create(EalingEvent())
            const ealingEventBookingTimeline = await EventBookingTimelineModel.create({ eventId: ealingEvent.id, events: [] })
        })()

        if (am_in_lambda()) {
            await syncPromiose
        }
    })

function getRandomDiet(): Required<ParticipantType>["kp"]["diet"] {
    const diets: Required<ParticipantType>["kp"]["diet"][] = ["omnivore", "omnivore", "omnivore", "vegetarian", "vegetarian", "vegan", "pescatarian", "pescatarian"];
    return diets[getRandomInt(0, 7)]
}

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomAttendance() {
    if (Math.random() < 0.10) return "First half";
    if (Math.random() < 0.10) return "Second half";
    return "Whole camp";
}

function getDays() {
    if (Math.random() < 0.90) return 127;
    if (Math.random() < 0.50) return 120;
    return 15
}

function getRandomDietPreference() {
    const extras = [
        "Really hates mushrooms",
        "Loves cheese",
        "Will only eat food that is blue",
        "Prfers no pasta",
        "No spicy food",
        "Not a salad fan",
        "Primal need to microwave tuna",
    ];
    return Math.random() > 0.5 ? extras[getRandomInt(0, extras.length)] : "";
}

function getRandomDietExtra() {
    const extras = [
        "Allergic to nuts",
        "Eats plain food only",
        "No tomatoes please",
        "Severe nut allergy",
        "Does not like potatoes",
        "Will only eay dinosaur shaped food",
        "Has a seafood allergy",
        "lactose intolerent, no dairy",
        "Subsists by consuming the souls of those around them",
        "Hematophageous",
        "Allergic to lentils",
        "Needs meat supplements",
        "No rabbit food please",
        "NO NUTS! THEY WILL DIE"
    ];
    return Math.random() > 0.5 ? extras[getRandomInt(0, extras.length)] : "";
}

function getRandomMedical() {
    const medical = [
        "Asthma",
        "Occasional migranes, takes Aspirin when needed",
        "server allergies, carries epipen",
        "diabetic",
        "Asthma, carries inhaler",
        "fluoxetine 2mg",
        "venlafaxine",
        "methyltestosterone",
        "drostanolone propionate",
        "Cebocap 50g daily",
        "diabeties injects daily",
        "Moody"

    ];
    return Math.random() > 0.95 ? medical[getRandomInt(0, medical.length)] : "";
}

function getRandomCampWith() {
    if (Math.random() < 0.75) return '';

    return "We would like to camp with " + faker.address.city();

}

//@ts-ignore
Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
};

function randomBool(chance: number): boolean {
    return Math.random() < chance;
}

const sleep = async (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
