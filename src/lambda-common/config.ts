import  fetch from 'node-fetch'
import am_in_lambda from './am_in_lambda.js'

export async function get_config() {
    if(am_in_lambda()) {
    const url = `http://localhost:2772/applications/bookings-config-${process.env.workspace}/environments/bookings-config-environment-${process.env.workspace}/configurations/bookings-config-profile-${process.env.workspace}`
    const data = await fetch(url, {})
    const json = await data.json()
    return json
    } else {
        const config = '../../config.js'
        return (await import(config)).default
    }
}