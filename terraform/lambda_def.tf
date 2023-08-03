variable "lambda_definitions" {
  description = "Map of lambda definitions"
  type        = map(any)

  default = {
    /*migrate = {
      name                 = "migrate"
      code_dir             = "migrate"
      path                 = "migrate"
      dont_create_endpoint = true
    },
    init = {
      name                 = "init"
      code_dir             = "init"
      path                 = "init"
      dont_create_endpoint = true
    },
    seed = {
      name                 = "seed"
      code_dir             = "seed"
      path                 = "seed"
      dont_create_endpoint = true
    },*/
    email = {
      name                 = "email"
      code                 = "email/email"
      path                 = "email"
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
      path   = "event/{id}/manage/timelrolesine"
      method = "get"
    },
    /*handlerSetup('/api/event/:id/manage/timeline', 'events/manage/getTimeline')
    events_delete = {
      name     = "events_delete"
      code_dir = "events/delete"
      path     = "event/delete"
      method   = "post"
    },
    events_details = {
      name     = "events_details"
      code_dir = "events/details"
      path     = "event/{id}/details"
      method   = "get"
    },
    apply = {
      name     = "apply"
      code_dir = "events/apply"
      path     = "event/{id}/apply"
      method   = "post"
    },*/
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
      code_dir = "bookings/get"
      path     = "booking/{id}"
      method   = "get"
    },*/
    bookings_edit = {
      name   = "bookings_edit"
      code   = "bookings/editBooking"
      path   = "booking/edit"
      method = "post"
    }, /*
    bookings_delete = {
      name     = "bookings_delete"
      code_dir = "bookings/delete"
      path     = "booking/delete"
      method   = "post"
    },
    bookings_syncmax = {
      name     = "bookings_syncmax"
      code_dir = "bookings/syncmax"
      path     = "booking/syncMax"
      method   = "post"
    },
    bookings_event = {
      name     = "bookings_event"
      code_dir = "bookings/event"
      path     = "booking/event/{id}"
      method   = "get"
    },
    village_create = {
      name     = "village_create"
      code_dir = "village/create"
      path     = "village/create"
      method   = "post"
    },
    village_delete = {
      name     = "village_delete"
      code_dir = "village/delete"
      path     = "village/delete"
      method   = "post"
    },
    village_assign = {
      name     = "village_assign"
      code_dir = "village/assign"
      path     = "village/assign"
      method   = "post"
    },
    village_rename = {
      name     = "village_rename"
      code_dir = "village/rename"
      path     = "village/rename"
      method   = "post"
    },
    application_decline = {
      name     = "application_decline"
      code_dir = "application/decline"
      path     = "application/decline"
      method   = "post"
    },
    application_approve = {
      name     = "application_approve"
      code_dir = "application/approve"
      path     = "application/approve"
      method   = "post"
    },
    role_create = {
      name     = "role_create"
      code_dir = "role/create"
      path     = "role/create"
      method   = "post"
    },
    role_delete = {
      name     = "role_delete"
      code_dir = "role/delete"
      path     = "role/delete"
      method   = "post"
    },
    payment_add = {
      name     = "payment_add"
      code_dir = "payment/add"
      path     = "payment/add"
      method   = "post"
    },
    payment_delete = {
      name     = "payment_delete"
      code_dir = "payment/delete"
      path     = "payment/delete"
      method   = "post"
    },
    membership_approve = {
      name     = "membership_approve"
      code_dir = "membership/approve"
      path     = "membership/approve"
      method   = "post"
    },
    membership_unapprove = {
      name     = "membership_unapprove"
      code_dir = "membership/unapprove"
      path     = "membership/unapprove"
      method   = "post"
    },
    dbs_approve = {
      name     = "dbs_approve"
      code_dir = "dbs/approve"
      path     = "dbs/approve"
      method   = "post"
    },
    dbs_unapprove = {
      name     = "dbs_unapprove"
      code_dir = "dbs/unapprove"
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
    }, /*
    auth_facebook_redirect = {
      name     = "auth_facebook_redirect"
      code_dir = "auth/facebook/redirect"
      path     = "auth/facebook/redirect"
      method   = "get"
    },
    auth_facebook_callback = {
      name     = "auth_facebook_callback"
      code_dir = "auth/facebook/callback"
      path     = "auth/facebook/callback"
      method   = "get"
    },
    auth_yahoo_redirect = {
      name     = "auth_yahoo_redirect"
      code_dir = "auth/yahoo/redirect"
      path     = "auth/yahoo/redirect"
      method   = "get"
    },
    auth_yahoo_callback = {
      name     = "auth_yahoo_callback"
      code_dir = "auth/yahoo/callback"
      path     = "auth/yahoo/callback"
      method   = "get"
    },
    auth_microsoft_redirect = {
      name     = "auth_microsoft_redirect"
      code_dir = "auth/microsoft/redirect"
      path     = "auth/microsoft/redirect"
      method   = "get"
    },
    auth_microsoft_callback = {
      name     = "auth_microsoft_callback"
      code_dir = "auth/microsoft/callback"
      path     = "auth/microsoft/callback"
      method   = "get"
    },*/
    client_error = {
      name   = "client_error"
      code   = "error/reportError"
      path   = "error"
      method = "post"
    }
  }
}

locals {
  filtered_lambdas = { for k, v in var.lambda_definitions : k => v if !contains(keys(v), "dont_create_lambda") }
}

locals {
  filtered_endpoints = { for k, v in var.lambda_definitions : k => v if !contains(keys(v), "dont_create_endpoint") }
}



