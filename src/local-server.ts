import path from 'path'
import { Path as path_parser } from 'path-parser'
import express from 'express'
//@ts-ignore
import { execute } from 'lambda-local'
import bodyParser from 'body-parser'
import fs from 'fs';
import https from 'https';

import * as urllib from 'url';
const __dirname = urllib.fileURLToPath(new URL('.', import.meta.url));

const app = express()
app.use(express.text())
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'application/x-www-form-urlencoded' }));

const handlerSetup = (url: string, lambda_path: string, method: string = "GET") => {

  const handler_func = method == "POST" ? app.post: app.get

  handler_func.bind(app)(url, async (req, res) => {
    try {

      const pp = new path_parser(url)
      const bits = pp.test(req.url)

      const lambdaURL = urllib.pathToFileURL(path.join(__dirname, "lambdas", lambda_path)).toString()

      const lambdaFunction = (await import(lambdaURL+'.js'))

      const result: any = await execute({
        lambdaFunc: lambdaFunction,
        lambdaHandler: 'lambdaHandler',
        timeoutMs: 60000,
        event: {
          headers: req.headers, // Pass on request headers
          body: typeof req.body == "string" ? req.body : JSON.stringify(req.body), // Pass on request body
          queryStringParameters: req.query,
          pathParameters: bits
        },
        environment: {
          LOCAL_SERVER: true
        }
      })

      // Respond to HTTP request
      res
        .status(result.statusCode)
        .set(result.headers)
        .end(result.body)
    } catch (e) {
      console.log(e)
    }
  })
}

//handlerSetup('/api/init', 'init/handler')
//handlerSetup('/api/test', 'test/handler')
//handlerSetup('/api/migrate', 'migrate/handler')
handlerSetup('/api/seed', 'seed/seed')

handlerSetup('/api/env', 'env/getEnv')

handlerSetup('/api/user', 'user/getUser')
handlerSetup('/api/user/edit', 'user/edit', "POST")
handlerSetup('/api/user/disableDriveSync', 'user/disableDriveSync', "POST")
handlerSetup('/api/user/logout', 'user/logout')
handlerSetup('/api/user/list/:eventId', 'user/listUsers')

handlerSetup('/api/events', 'events/getEvents')
handlerSetup('/api/event/create', 'events/createEvent', 'POST')
handlerSetup('/api/event/edit', 'events/editEvent', 'POST')

//handlerSetup('/api/event/delete', 'events/delete/handler', 'POST')
//handlerSetup('/api/event/:id', 'events/single/handler')
//handlerSetup('/api/event/:id/details', 'events/details/handler')
//handlerSetup('/api/event/:id/apply', 'events/apply/handler', 'POST')
handlerSetup('/api/event/:id/manage/bookings', 'events/manage/getEventBookings')
handlerSetup('/api/event/:id/manage/bookings/:timestamp', 'events/manage/getEventHistoricalBookings')
handlerSetup('/api/event/:id/manage/timeline', 'events/manage/getEventTimeline')
handlerSetup('/api/event/:id/manage/roles', 'events/manage/getRoles')
handlerSetup('/api/event/:id/manage/applications', 'events/manage/getApplications')
handlerSetup('/api/event/:id/manage/roles/create', 'events/manage/createRole', "POST")
handlerSetup('/api/event/:id/manage/roles/delete', 'events/manage/deleteRole', "POST")
handlerSetup('/api/event/:id/manage/booking/:userId/operation', 'events/manage/bookingOperation', "POST")
handlerSetup('/api/event/:id/manage/application/:userId/operation', 'events/manage/applicationOperation', "POST")
handlerSetup('/api/booking/user', 'bookings/getUsersBookings')
handlerSetup('/api/booking/create', 'bookings/createBooking', "POST")
//handlerSetup('/api/booking/:id', 'bookings/get/handler')
handlerSetup('/api/booking/edit', 'bookings/editBooking', "POST")
handlerSetup('/api/booking/delete', 'bookings/deletebooking', "POST")
//handlerSetup('/api/booking/event/:id', 'bookings/event/handler')
//handlerSetup('/api/booking/syncmax', 'bookings/syncmax/handler', "POST")

handlerSetup('/api/event/:eventid/sheet', 'bookings/getBookingHasSheet')
handlerSetup('/api/event/:eventid/createSheet', 'bookings/createSheetForBooking', "POST")
handlerSetup('/api/event/:eventid/getParticipantsFromSheet', 'bookings/getParticipantsFromSheet')


//handlerSetup('/api/village/create', 'village/create/handler', "POST")
//handlerSetup('/api/village/delete', 'village/delete/handler', "POST")
//handlerSetup('/api/village/assign', 'village/assign/handler', "POST")
//handlerSetup('/api/village/rename', 'village/rename/handler', "POST")

handlerSetup('/api/booking/apply', 'application/apply', "POST")
//handlerSetup('/api/application/approve', 'application/approve/handler', "POST")

//handlerSetup('/api/role/delete', 'role/delete/handler', "POST")

//handlerSetup('/api/payment/add', 'payment/add/handler', "POST")
//handlerSetup('/api/payment/delete', 'payment/delete/handler', "POST")

//handlerSetup('/api/membership/approve', 'membership/approve/handler', "POST")
//handlerSetup('/api/membership/unapprove', 'membership/unapprove/handler', "POST")

//handlerSetup('/api/dbs/approve', 'dbs/approve/handler', "POST")
//handlerSetup('/api/dbs/unapprove', 'dbs/unapprove/handler', "POST")

handlerSetup('/api/auth/google/redirect', 'auth/google/redirect')
handlerSetup('/api/auth/google/callback', 'auth/google/callback')

handlerSetup('/api/auth/google_drive/redirect', 'auth/google_drive/redirect')
handlerSetup('/api/auth/google_drive/callback', 'auth/google_drive/callback')

handlerSetup('/api/auth/facebook/redirect', 'auth/facebook/redirect')
handlerSetup('/api/auth/facebook/callback', 'auth/facebook/callback')

handlerSetup('/api/auth/apple/redirect', 'auth/apple/redirect')
handlerSetup('/api/auth/apple/callback', 'auth/apple/callback', 'POST')

handlerSetup('/api/auth/yahoo/redirect', 'auth/yahoo/redirect')
handlerSetup('/api/auth/yahoo/callback', 'auth/yahoo/callback')

handlerSetup('/api/auth/microsoft/redirect', 'auth/microsoft/redirect')
handlerSetup('/api/auth/microsoft/callback', 'auth/microsoft/callback')

handlerSetup('/api/error', 'error/reportError', "POST")


app.use('/', express.static(path.join(__dirname, '../public'), {fallthrough: true, index: "index.html"}));


app.get('*', function (req, res) {  //serve index.html on deep paths
  if(!req.url.includes('/api/')) return res.sendFile(path.join(__dirname, '../public', 'index.html'));
  return res.status(404).end()
});

const httpsOptions = {
  key: fs.readFileSync('./cert/cert.key'),
  cert: fs.readFileSync('./cert/cert.pem')
}

const server = https.createServer(httpsOptions, app)
    .listen(443, () => {
        console.log('server running at ' + 443)
    })
