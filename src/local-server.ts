import path from 'path'
import { Path as path_parser } from 'path-parser'
import express from 'express'
//@ts-ignore
import { execute } from 'lambda-local'
import bodyParser from 'body-parser'

import * as urllib from 'url';
const __dirname = urllib.fileURLToPath(new URL('.', import.meta.url));

const app = express()
app.use(express.text())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

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
          body: JSON.stringify(req.body), // Pass on request body
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
//handlerSetup('/api/seed', 'seed/handler')

handlerSetup('/api/env', 'env/getEnv')

handlerSetup('/api/user', 'user/getUser')
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

handlerSetup('/api/booking/user', 'bookings/getUsersBookings')
handlerSetup('/api/booking/create', 'bookings/createBooking', "POST")
//handlerSetup('/api/booking/:id', 'bookings/get/handler')
handlerSetup('/api/booking/edit', 'bookings/editBooking', "POST")
//handlerSetup('/api/booking/delete', 'bookings/delete/handler', "POST")
//handlerSetup('/api/booking/event/:id', 'bookings/event/handler')
//handlerSetup('/api/booking/syncmax', 'bookings/syncmax/handler', "POST")



//handlerSetup('/api/village/create', 'village/create/handler', "POST")
//handlerSetup('/api/village/delete', 'village/delete/handler', "POST")
//handlerSetup('/api/village/assign', 'village/assign/handler', "POST")
//handlerSetup('/api/village/rename', 'village/rename/handler', "POST")

//handlerSetup('/api/application/decline', 'application/decline/handler', "POST")
//handlerSetup('/api/application/approve', 'application/approve/handler', "POST")

//handlerSetup('/api/role/create', 'role/create/handler', "POST")
//handlerSetup('/api/role/delete', 'role/delete/handler', "POST")

//handlerSetup('/api/payment/add', 'payment/add/handler', "POST")
//handlerSetup('/api/payment/delete', 'payment/delete/handler', "POST")

//handlerSetup('/api/membership/approve', 'membership/approve/handler', "POST")
//handlerSetup('/api/membership/unapprove', 'membership/unapprove/handler', "POST")

//handlerSetup('/api/dbs/approve', 'dbs/approve/handler', "POST")
//handlerSetup('/api/dbs/unapprove', 'dbs/unapprove/handler', "POST")

handlerSetup('/api/auth/google/redirect', 'auth/google/redirect')
handlerSetup('/api/auth/google/callback', 'auth/google/callback')

//handlerSetup('/api/auth/facebook/redirect', 'auth/facebook/redirect/handler')
//handlerSetup('/api/auth/facebook/callback', 'auth/facebook/callback/handler')

//handlerSetup('/api/auth/yahoo/redirect', 'auth/yahoo/redirect/handler')
//handlerSetup('/api/auth/yahoo/callback', 'auth/yahoo/callback/handler')

//handlerSetup('/api/auth/microsoft/redirect', 'auth/microsoft/redirect/handler')
//handlerSetup('/api/auth/microsoft/callback', 'auth/microsoft/callback/handler')

handlerSetup('/api/error', 'error/reportError')


app.use('/', express.static(path.join(__dirname, '../public'), {fallthrough: true, index: "index.html"}));


app.get('*', function (req, res) {  //serve index.html on deep paths
  if(!req.url.includes('/api/')) return res.sendFile(path.join(__dirname, '../public', 'index.html'));
  return res.status(404).end()
});

app.listen(3000, () => console.log('listening on port: 3000'))