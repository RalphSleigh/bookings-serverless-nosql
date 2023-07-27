import React, { createContext } from 'react';
import { useEnv, userQuery } from '../queries.js';
import { useQueryClient } from "@tanstack/react-query";

export const EnvContext = createContext("dev");

export function EnvContextProvider(props) {
    const queryClient = useQueryClient()
    queryClient.prefetchQuery(userQuery)
    const { env } = useEnv().data

    return <EnvContext.Provider value={env}>
        {props.children}
    </EnvContext.Provider>
}

