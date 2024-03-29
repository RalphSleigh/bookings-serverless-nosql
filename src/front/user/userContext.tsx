import React from 'react';
import { createContext } from 'react';
import { useUser } from '../queries.js'

import type { JsonUserResponseType, UserType } from '../../lambda-common/onetable.js'

export const UserContext = createContext<JsonUserResponseType>(null);


export function UserContextProvider(props) {
    const { user } = useUser().data

    return <UserContext.Provider value={user}>
        {props.children}
    </UserContext.Provider>
}


