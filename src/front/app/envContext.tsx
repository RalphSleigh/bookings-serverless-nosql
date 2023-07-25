import { useQuery } from '@tanstack/react-query';
import React, { createContext } from 'react';
import { get_api } from '../queries.js';
import { SuspenseWrapper } from '../suspense.js';

export const EnvContext = createContext("dev");

export function EnvContextProvider(props) {
    const data = useQuery(['env'], getEnv).data!

    return <EnvContext.Provider value={data.env}>
        {props.children}
    </EnvContext.Provider>
}

async function getEnv() {
    return await get_api<{ env: string }>('env')
}