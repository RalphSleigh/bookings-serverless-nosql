import _ from 'lodash';
import { BookingType, EventBookingTimelineType, EventType, JsonBookingType, JsonParticipantType, OnetableBookingType, OnetableEventType, ParticipantType, RoleType, UserType, UserWithRoles, table } from './onetable.js';
import { Model } from 'dynamodb-onetable';
import { getFee } from '../shared/fee/fee.js';
//import { db } from './orm'

const RoleModel = table.getModel<RoleType>('Role')
const UserModel = table.getModel<UserType>('User')
const BookingModel: Model<OnetableBookingType> = table.getModel<OnetableBookingType>('Booking')
const EventBookingTimelineModel = table.getModel<EventBookingTimelineType>('EventBookingTimeline')

export function updateParticipantsDates(existing: Array<ParticipantType>, incoming: Array<JsonParticipantType> | Array<ParticipantType>) {
    let now = new Date()

    incoming.forEach(p => {
        const existingParticipant = existing.find(ep => ep.basic.name === p.basic.name && ep.created.toISOString() === p.created)
        const existingToCompare = {..._.cloneDeep(existingParticipant), created: null, updated: null}
        const newToCompare = {..._.cloneDeep(p), created: null, updated: null}
        const updated = existingParticipant && !_.isEqual(existingToCompare, newToCompare)
        p.created = existingParticipant ? existingParticipant.created.toISOString() : now.toISOString()
        p.updated = !existingParticipant || updated ? now.toISOString() : existingParticipant.updated.toISOString()
        now = new Date(now.getTime() + 1)
    })
}

export async function getUsersWithRolesForEvent(event: OnetableEventType, rolesNames: Array<RoleType["role"]>): Promise<UserWithRoles[]> {
    const roles = await RoleModel.find({ sk: { begins: event.id } })
    const users = await UserModel.scan()
    const usersWithRoles = users.filter(u => roles.find(r => r.userId === u.id && rolesNames.includes(r.role)))
    return usersWithRoles.map(u => {
        const userRoles = roles.filter(r => r.userId === u.id)
        return { roles: userRoles, ...u }
    })
}

export async function addVersionToBooking(event: EventType, existing: BookingType, newData: Partial<BookingType>) {
    if(newData.participants) updateParticipantsDates(existing.participants, newData.participants!)

    const fees = getFee(event)
    fees.processBookingUpdate(event, existing, newData)

    const newLatest = await BookingModel.update({ ...existing, ...newData, deleted: false }, { partial: false })
    const newVersion = await BookingModel.create({ ...newLatest, version: newLatest.updated.toISOString() })

    EventBookingTimelineModel.update({ eventId: newVersion.eventId }, {
            set: { events: 'list_append(if_not_exists(events, @{emptyList}), @{newEvent})' },
            substitutions: { newEvent: [{ userId: newVersion.userId, time: newLatest.updated.toISOString() }], emptyList: [] }
        })

    return newVersion
}

/* export function updateAssociation(db, instance, key, Association, values) {

    let ops:any[] = [];
	//delete no longer present
	ops = [...ops, ...instance[key].filter(p => !values.find(q => q.id === p.id)).map(p => p.destroy())];
	//update existing
	ops = [...ops, ...values.filter(p => p.id).map(p => Association.findOne({ where: { id: p.id } }).then(q => q ? q.update(p) : null))];
	//add new ones
	ops = [...ops, ...values.filter(p => !p.id).map(p => {
        p[Association.associations[instance.constructor.name].foreignKey] = instance.id;
		return Association.create(p);
	})];
	return Promise.all(ops);
};



export async function getEventDetails(db: db, id: string | number) {
	let event: any = await db.event.findOne({where: {id: id}})
	if (event === null) return null;
	else {
		const roles = await db.role.findAll({where: {eventId: event.id}})
		const villages = await db.village.findAll({where: {eventId: event.id}})
		const organisations = await db.organisation.findAll({where: {eventId: event.id}})
		const applications = await db.application.findAll({where: {eventId: event.id}})
		const users = await db.user.findAll();

		event = event.get({plain: true})

		event.roles = roles.map(role => {
			const r = role.get({plain: true})
			r.user = users.find(u => u.id === r.userId)
			r.village = villages.find(v => v.id === r.villageId)
			r.organisation = organisations.find(o => o.id === r.organisationId)
			return r
		})
		event.applications = applications.map(app => {
			const a = app.get({plain: true})
			a.user = users.find(u => u.id === a.userId)
			return a
		})
		event.organisations = organisations
		event.villages = villages
		event.user = users.find(u => u.id === event.userId)
		return event;
	}
}

export function getUserScopes(db, user, event, participants = true) {

    const scopes:any  = [];

    if (user.roles.find(role => role.name === "admin") || user.id === event.userId) scopes.push({method: ['Limited', event.id, null, null, participants ? 'defaultScope': null, true]});

    user.roles.filter(r => r.eventId === event.id && r.name !== 'book').forEach(r => {

        let participantScope:any  = null;
        let includePayments = false;
        switch (r.name) {
            case "KP":
                participantScope = "KP";
                break;
            case "Money":
                participantScope = "Money";
                includePayments = true;
                break;
            default:
                participantScope = "defaultScope";
        }

        scopes.push({method: ['Limited', event.id, r.villageId, r.organisationId, participants ? participantScope : null, includePayments]})
    });

    return scopes;

};

export async function getBookingsAndCombineScopes(db, user, event) {
    const scopes = getUserScopes(db, user, event);
    console.log(`getting details for ${scopes.length} scopes`)
    console.log(scopes)
    const results = await Promise.all(scopes.map(s => db.booking.scope(s).findAll()));

    const obj = results.filter(r => r).reduce((a, c) => {

        c.forEach(b => {

            a[b.id] = a[b.id] || {}

            _.merge(a[b.id], b.get({plain: true}))

        });

        return a

    }, {});

    const flat:any = []

    for (let key in obj) flat.push(obj[key])

    return flat
}

export async function getBookingAndCombineScopes(db, user, booking) {

    const scopes = getUserScopes(db, user, booking.event);
    const results = await Promise.all(scopes.map(s => db.booking.scope(s).findOne({where: {id: booking.id}})));

    const obj = results.filter(r => r).reduce((a, c) => {

        _.merge(a, c.get({plain: true}))
        return a

    }, {});

    return [obj]
}
 */