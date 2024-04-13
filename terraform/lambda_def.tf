variable "lambda_definitions" {
  description = "Map of lambda definitions"
  type        = map(any)

  default = {
    /*migrate = {
      name                 = "migrate"
      code             = "migrate"
      path                 = "migrate"
      dont_create_endpoint = true
    },
    init = {
      name                 = "init"
      code             = "init"
      path                 = "init"
      dont_create_endpoint = true
    },*/
    seed = {
      name                 = "seed"
      code             = "seed/seed"
      path                 = "seed"
      dont_create_endpoint = true
    },
    env = {
      name   = "env"
      code   = "env/getEnv"
      path   = "env"
      method = "get"
    }
    user = {
      name   = "user"
      code   = "user/getUser"
      path   = "user"
      method = "get"
    },
    user_edit = {
      name   = "user_edit"
      code   = "user/edit"
      path   = "user/edit"
      method = "post"
    },
    user_disable_drive_sync = {
      name   = "user_disable_drive_sync"
      code   = "user/disableDriveSync"
      path   = "user/disable_drive_sync"
      method = "post"
    },
    user_logout = {
      name   = "user_logout"
      code   = "user/logout"
      path   = "user/logout"
      method = "get"
    },
    user_list = {
      name   = "user_list"
      code   = "user/listUsers"
      path   = "user/list/{eventId}"
      method = "get"
    },
    events = {
      name   = "events"
      code   = "events/getEvents"
      path   = "events"
      method = "get"
    },
    events_create = {
      name   = "events_create"
      code   = "events/createEvent"
      path   = "event/create"
      method = "post"
    },
    events_edit = {
      name   = "events_edit"
      code   = "events/editEvent"
      path   = "event/edit"
      method = "post"
    },
    event_bookings = {
      name   = "events_bookings"
      code   = "events/manage/getEventBookings"
      path   = "event/{id}/manage/bookings"
      method = "get"
    },
    event_bookings_historical = {
      name   = "events_bookings_historical"
      code   = "events/manage/getEventHistoricalBookings"
      path   = "event/{id}/manage/bookings/{timestamp}"
      method = "get"
    },
    event_timeline = {
      name   = "events_timeline"
      code   = "events/manage/getEventTimeline"
      path   = "event/{id}/manage/timeline"
      method = "get"
    },
    event_roles = {
      name   = "events_roles"
      code   = "events/manage/getRoles"
      path   = "event/{id}/manage/roles"
      method = "get"
    },
    event_applications = {
      name   = "event_applications"
      code   = "events/manage/getApplications"
      path   = "event/{id}/manage/applications"
      method = "get"
    },
    event_roles_create = {
      name   = "event_roles_create"
      code   = "events/manage/createRole"
      path   = "event/{id}/manage/roles/create"
      method = "post"
    },
    event_roles_delete = {
      name   = "event_roles_delete"
      code   = "events/manage/deleteRole"
      path   = "event/{id}/manage/roles/delete"
      method = "post"
    },
    event_application_operation = {
      name   = "event_application_operation"
      code   = "events/manage/applicationOperation"
      path   = "event/{id}/manage/application/{userId}/operation"
      method = "post"
    },
    event_booking_operation = {
      name   = "event_booking_operation"
      code   = "events/manage/bookingOperation"
      path   = "event/{id}/manage/booking/{userId}/operation"
      method = "post"
    },
    /*handlerSetup('/api/event/:id/manage/timeline', 'events/manage/getTimeline')
    handlerSetup('/api/event/:id/manage/booking/:userId/operation', 'events/manage/bookingOperation', "POST")
    events_delete = {
      name     = "events_delete"
      code = "events/delete"
      path     = "event/delete"
      method   = "post"
    },
    events_details = {
      name     = "events_details"
      code = "events/details"
      path     = "event/{id}/details"
      method   = "get"
    },*/
    apply = {
      name     = "apply"
      code     = "application/apply"
      path     = "booking/apply"
      method   = "post"
    },
    bookings_user = {
      name   = "bookings_user"
      code   = "bookings/getUsersBookings"
      path   = "booking/user"
      method = "get"
    },
    bookings_create = {
      name   = "bookings_create"
      code   = "bookings/createBooking"
      path   = "booking/create"
      method = "post"
    }, /*
    bookings_get = {
      name     = "bookings_get"
      code = "bookings/get"
      path     = "booking/{id}"
      method   = "get"
    },*/
    bookings_edit = {
      name   = "bookings_edit"
      code   = "bookings/editBooking"
      path   = "booking/edit"
      method = "post"
    },
    bookings_delete = {
      name   = "bookings_delete"
      code   = "bookings/deleteBooking"
      path   = "booking/delete"
      method = "post"
    }, /*
    bookings_syncmax = {
      name     = "bookings_syncmax"
      code = "bookings/syncmax"
      path     = "booking/syncMax"
      method   = "post"
    },
    bookings_event = {
      name     = "bookings_event"
      code = "bookings/event"
      path     = "booking/event/{id}"
      method   = "get"
    },
    village_create = {
      name     = "village_create"
      code = "village/create"
      path     = "village/create"
      method   = "post"
    },
    village_delete = {
      name     = "village_delete"
      code = "village/delete"
      path     = "village/delete"
      method   = "post"
    },
    village_assign = {
      name     = "village_assign"
      code = "village/assign"
      path     = "village/assign"
      method   = "post"
    },
    village_rename = {
      name     = "village_rename"
      code = "village/rename"
      path     = "village/rename"
      method   = "post"
    },
    application_decline = {
      name     = "application_decline"
      code = "application/decline"
      path     = "application/decline"
      method   = "post"
    },
    application_approve = {
      name     = "application_approve"
      code = "application/approve"
      path     = "application/approve"
      method   = "post"
    },
    role_create = {
      name     = "role_create"
      code = "role/create"
      path     = "role/create"
      method   = "post"
    },
    role_delete = {
      name     = "role_delete"
      code = "role/delete"
      path     = "role/delete"
      method   = "post"
    },
    payment_add = {
      name     = "payment_add"
      code = "payment/add"
      path     = "payment/add"
      method   = "post"
    },
    payment_delete = {
      name     = "payment_delete"
      code = "payment/delete"
      path     = "payment/delete"
      method   = "post"
    },
    membership_approve = {
      name     = "membership_approve"
      code = "membership/approve"
      path     = "membership/approve"
      method   = "post"
    },
    membership_unapprove = {
      name     = "membership_unapprove"
      code = "membership/unapprove"
      path     = "membership/unapprove"
      method   = "post"
    },
    dbs_approve = {
      name     = "dbs_approve"
      code = "dbs/approve"
      path     = "dbs/approve"
      method   = "post"
    },
    dbs_unapprove = {
      name     = "dbs_unapprove"
      code = "dbs/unapprove"
      path     = "dbs/unapprove"
      method   = "post"
    },*/
    auth_google_redirect = {
      name   = "auth_google_redirect"
      code   = "auth/google/redirect"
      path   = "auth/google/redirect"
      method = "get"
    },
    auth_google_callback = {
      name   = "auth_google_callback"
      code   = "auth/google/callback"
      path   = "auth/google/callback"
      method = "get"
    },
    auth_google_drive_redirect = {
      name   = "auth_google_drive_redirect"
      code   = "auth/google_drive/redirect"
      path   = "auth/google_drive/redirect"
      method = "get"
    },
    auth_google_drive_callback = {
      name   = "auth_google_drive_callback"
      code   = "auth/google_drive/callback"
      path   = "auth/google_drive/callback"
      method = "get"
    },
    auth_facebook_redirect = {
      name   = "auth_facebook_redirect"
      code   = "auth/facebook/redirect"
      path   = "auth/facebook/redirect"
      method = "get"
    },
    auth_facebook_callback = {
      name   = "auth_facebook_callback"
      code   = "auth/facebook/callback"
      path   = "auth/facebook/callback"
      method = "get"
    },
    auth_yahoo_redirect = {
      name     = "auth_yahoo_redirect"
      code = "auth/yahoo/redirect"
      path     = "auth/yahoo/redirect"
      method   = "get"
    },
    auth_yahoo_callback = {
      name     = "auth_yahoo_callback"
      code = "auth/yahoo/callback"
      path     = "auth/yahoo/callback"
      method   = "get"
    },
    auth_microsoft_redirect = {
      name     = "auth_microsoft_redirect"
      code = "auth/microsoft/redirect"
      path     = "auth/microsoft/redirect"
      method   = "get"
    },
    auth_microsoft_callback = {
      name     = "auth_microsoft_callback"
      code = "auth/microsoft/callback"
      path     = "auth/microsoft/callback"
      method   = "get"
    },
      auth_apple_redirect = {
      name     = "auth_apple_redirect"
      code = "auth/apple/redirect"
      path     = "auth/apple/redirect"
      method   = "get"
    },
    auth_apple_callback = {
      name     = "auth_apple_callback"
      code = "auth/apple/callback"
      path     = "auth/apple/callback"
      method   = "post"
    },
    client_error = {
      name   = "client_error"
      code   = "error/reportError"
      path   = "error"
      method = "post"
    },
    discord_slashcommands = {
      name   = "discord_slashcommands"
      code   = "discord/slashcommands"
      path   = "discord/slashcommands"
      method = "post"
    },
    get_booking_has_sheet = {
      name   = "get_booking_has_sheet"
      code   = "booking/getBookingHasSheet"
      path   = "event/{eventid}/sheet"
    },
    create_sheet_for_booking = {
      name   = "create_sheet_for_booking"
      code   = "bookings/createSheetForBooking"
      path   = "event/{eventid}/createSheet"
      method = "post"
    },
    get_participants_from_sheet = {
      name   = "get_participants_from_sheet"
      code   = "bookings/getParticipantsFromSheet"
      path   = "event/{eventid}/getParticipantsFromSheet"
    }
  }
}

locals {
  filtered_lambdas = { for k, v in var.lambda_definitions : k => v if !contains(keys(v), "dont_create_lambda") }
}

locals {
  filtered_endpoints = { for k, v in var.lambda_definitions : k => v if !contains(keys(v), "dont_create_endpoint") }
}



