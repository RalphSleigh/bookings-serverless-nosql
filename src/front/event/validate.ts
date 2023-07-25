import { isValid } from "date-fns"
import { parseDate } from "../util.js"

export function validate(data) {
    if(['name', 'feeStructure'].map(item => stringExistsAndNotEmpty(data[item])).filter(i => !i).length > 0) return false
    if(['startDate', 'endDate', 'bookingDeadline'].map(item => dateExistsAndValid(data[item])).filter(i => !i).length > 0) return false
    return true
}

function stringExistsAndNotEmpty(value) {
    return value && value !== ""
}

function dateExistsAndValid(value) {
    return value && isValid(parseDate(value)) 
}