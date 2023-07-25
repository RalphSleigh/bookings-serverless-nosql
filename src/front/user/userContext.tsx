import { useQuery } from '@tanstack/react-query'
import React from 'react';
import { createContext } from 'react';
import { get_api } from '../queries.js'
import { SuspenseWrapper } from '../suspense.js';

import type  { UserType } from '../../lambda-common/onetable.js'
type UserContextType = UserType | undefined

export const UserContext = createContext<UserContextType>(undefined);


export function UserContextProvider(props) {
    const user = useQuery(['user'], getUser).data!

    return <UserContext.Provider value={user.user}>
            {props.children}
            </UserContext.Provider>
}


function getUser() {
    return get_api<{user: UserContextType}>('user')
}