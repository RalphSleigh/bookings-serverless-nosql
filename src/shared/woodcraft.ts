//this file contains age groups, etc

import { differenceInYears } from "date-fns"
import { JsonEventType, JsonParticipantWithBasicType } from "../lambda-common/onetable.js"
import { parseDate } from "./util.js"

export abstract class AgeGroup {
    abstract name: string
    abstract singular: string
    abstract filter: (age: number) => boolean

    public displayAgeGroup(age: number) {
        return age > 20 ? this.singular : `${this.singular} (${age})`
    }
}

class Woodchip extends AgeGroup {
    name = "Woodchips"
    singular = "Woodchip"
    filter = age => {
        return age < 6
    }
}

class Elfin extends AgeGroup {
    name = "Elfins"
    singular = "Elfin"
    filter = age => {
        return age > 5 && age < 10
    }
}

class Pioneer extends AgeGroup {
    name = "Pioneers"
    singular = "Pioneer"
    filter = age => {
        return age > 9 && age < 13
    }
}

class Venturer extends AgeGroup {
    name = "Venturers"
    singular = "Venturer"
    filter = age => {
        return age > 12 && age < 16
    }
}

class DF extends AgeGroup {
    name = "DFs"
    singular = "DF"
    filter = age => {
        return age > 15 && age < 21
    }
}

class Adult extends AgeGroup {
    name = "Adults"
    singular = "Adult"
    filter = age => {
        return age > 20
    }
}

type ParticipantGroup = { group: AgeGroup, participants: JsonParticipantWithBasicType[] }

export function ageGroups(): AgeGroup[] {
    return [new Woodchip(), new Elfin(), new Pioneer(), new Venturer(), new DF(), new Adult()]
}

export function getAgeGroup(age: number): AgeGroup {
    const groups = ageGroups()
    return groups.find(g => g.filter(age))!
}

export function groupParticipants(participants: JsonParticipantWithBasicType[], event: JsonEventType): ParticipantGroup[] {
    const startDate = parseDate(event.startDate)!
    const groups = [new Woodchip(), new Elfin(), new Pioneer(), new Venturer(), new DF(), new Adult()]
    const grouped: ParticipantGroup[] = []
    for (const group of groups) {
        grouped.push({
            group, participants: participants.filter(p => {
                const age = differenceInYears(startDate, parseDate(p.basic.dob)!)
                return group.filter(age)
            })
        })
    }
    return grouped
}