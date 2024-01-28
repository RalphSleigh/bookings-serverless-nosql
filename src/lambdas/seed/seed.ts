import { fakerEN_GB as faker } from '@faker-js/faker';
import { BookingType, EventBookingTimelineType, EventType, OnetableBookingType, OnetableEventType, ParticipantType, UserType, table } from '../../lambda-common/onetable.js';
import { Model } from 'dynamodb-onetable';
import { updateParticipantsDates } from '../../lambda-common/util.js';
import { lambda_wrapper_json } from '../../lambda-common/lambda_wrappers.js';
import am_in_lambda from '../../lambda-common/am_in_lambda.js';

const UserModel: Model<UserType> = table.getModel<UserType>('User')
const EventModel: Model<OnetableEventType> = table.getModel<OnetableEventType>('Event')
const EventBookingTimelineModel: Model<EventBookingTimelineType> = table.getModel<EventBookingTimelineType>('EventBookingTimeline')
const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>('Booking')

const randomParticipant: () => ParticipantType = () => {
    //@ts-ignore
    const participant: ParticipantType = {
        basic: {
            name: faker.person.fullName(),
            dob: faker.date.birthdate({
                min: 3,
                max: 25,
                mode: "age"
            })

        },
        kp: {
            diet: getRandomDiet(),
            details: getRandomDietExtra(),
        },
        medical: {
            details: getRandomMedical(),
        },
    }

    return participant
}

const sleep = async (seconds: number) => {   
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export const lambdaHandler = lambda_wrapper_json(
    async (lambda_event, config, current_user) => {

        const syncPromiose = (async () => {

            const event = await EventModel.create({
                name: "Test Event",
                id: "test-event",
                description: "This is a test event",
                startDate: new Date(2025, 8, 1),
                endDate: new Date(2025, 8, 7),
                bookingDeadline: new Date(2025, 7, 1),
                emailSubjectTag: "TEST",
                replyTo: faker.internet.email(),
                kpMode: "basic",
                feeStructure: "flat",
                feeData: {
                    fee: 100
                },
                attendanceStructure: "whole",
                customQuestions: [],
                bigCampMode: true
            })

            const newEventBookingTimeline = await EventBookingTimelineModel.create({ eventId: event.id, events: [] })

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

                const booking: Partial<OnetableBookingType> = {
                    eventId: event.id,
                    userId: user.id,
                    version: "latest",
                    deleted: false,
                    basic: {
                        contactName: faker.person.fullName(),
                        contactEmail: faker.internet.email(),
                        contactPhone: faker.phone.number(),
                        district: faker.location.city(),
                    },
                    participants: Array(getRandomInt(1, 40)).fill(0).map(randomParticipant),
                }
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
        })()

        if(am_in_lambda())  {
            await syncPromiose
        }
    })

function getRandomDiet(): Required<ParticipantType>["kp"]["diet"] {
    const diets: Required<ParticipantType>["kp"]["diet"][] = ["omnivore", "omnivore", "omnivore", "vegetarian", "vegetarian", "vegan", "pescatarian"];
    return diets[getRandomInt(0, 6)]
}

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}


function getDays() {
    if (Math.random() < 0.90) return 127;
    if (Math.random() < 0.50) return 120;
    return 15
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
    return Math.random() > 0.95 ? extras[getRandomInt(0, extras.length)] : "";
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

function getRandomPaymentType() {
    const types = ["Cheque", "Cheque", "Bank Transfer", "Bank Transfer", "Bank Transfer", "Cash"];
    return types[getRandomInt(0, 6)]
}

//@ts-ignore
Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
};

