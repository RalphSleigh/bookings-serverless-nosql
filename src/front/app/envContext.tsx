import React, { createContext } from 'react';
import { eventsQuery, useEnv, userBookingsQuery, userQuery } from '../queries.js';
import { useQueryClient } from "@tanstack/react-query";

export const EnvContext = createContext("dev");

export function EnvContextProvider(props) {
    const queryClient = useQueryClient()
    queryClient.prefetchQuery(userQuery)
    queryClient.prefetchQuery(eventsQuery)
    queryClient.prefetchQuery(userBookingsQuery)
    const { env } = useEnv().data

    return <EnvContext.Provider value={env}>
        {props.children}
    </EnvContext.Provider>
}

