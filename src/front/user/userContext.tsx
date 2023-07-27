import React from 'react';
import { createContext } from 'react';
import { useUser } from '../queries.js'

import type { UserType } from '../../lambda-common/onetable.js'
export type UserContextType = UserType | undefined

export const UserContext = createContext<UserContextType>(undefined);


export function UserContextProvider(props) {
    const { user } = useUser().data

    return <UserContext.Provider value={user}>
        {props.children}
    </UserContext.Provider>
}


