import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline, Paper, useMediaQuery } from '@mui/material';
import { useMemo, useState } from 'react';
import { ThemeContext } from './themeContext.js';
import { Unstable_Grid2 as Grid } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserContextProvider } from '../user/userContext.js';
import { EnvContextProvider } from './envContext.js';
import { SuspenseWrapper } from '../suspense.js';
import { AppToolbar } from './toolbar.js';
import {
    createBrowserRouter,
    Outlet,
    RouterProvider,
    Link as RouterLink,
    LinkProps as RouterLinkProps
} from "react-router-dom";
import { LoginPage } from '../user/loginPage.js';
import { EventList } from '../event/eventList.js';
import { LinkProps } from '@mui/material/Link';
import { CreateEventPage } from '../event/create.js';
import { EnsureHasPermission, EnsureLoggedInRoute } from '../permissions.js';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { EditEventLoader } from '../event/editLoader.js';
import enGB from 'date-fns/locale/en-GB';
import { CreateBookingLoader } from '../booking/createLoader.js';
import { EditOwnBookingLoader } from '../booking/editOwnBookingLoader.js';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            suspense: true,
            staleTime: 1000 * 60 * 5
        },
    },
})

const router = createBrowserRouter([{
    element: <><AppToolbar /><SuspenseWrapper><Outlet /></SuspenseWrapper></>,
    children: [
        {
            path: "/",
            element: <EventList />
        },
        {
            path: "login",
            element: <LoginPage />,
        },
        {
            element: <EnsureLoggedInRoute />,
            children: [{
                path: "event/create",
                element: <CreateEventPage />
            },{
                path: "event/:eventId/edit",
                element: <EditEventLoader />,
            },{
                path: "event/:eventId/book",
                element: <CreateBookingLoader />,
            },{
                path: "event/:eventId/edit-my-booking",
                element: <EditOwnBookingLoader />,
            },{
                lazy: () => import('../manage/manageLoader.js'),
                children: [{
                    path: "event/:eventId/manage",
                    lazy: () => import('../manage/managePage.js'),
                    children: [{
                        index: true,
                        lazy: () => import('../manage/participants.js')
                    },{
                        path: "participants",
                        lazy: () => import('../manage/participants.js')
                    },{
                        path: "bookings",
                        lazy: () => import('../manage/participants.js')
                    },{
                        path: "roles",
                        lazy: () => import('../manage/participants.js')
                    }]
                }]
            }
        ]
        }]
}], {
    future: {
        // Normalize `useNavigation()`/`useFetcher()` `formMethod` to uppercase
        v7_normalizeFormMethod: true,
    }
});

const LinkBehavior = React.forwardRef<
    HTMLAnchorElement,
    Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
    const { href, ...other } = props;
    // Map href (MUI) -> to (react-router)
    return <RouterLink ref={ref} to={href} {...other} />;
});

export function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');
    const colorMode = useMemo(
        () => ({
            mode: mode,
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
        }),
        [],
    );

    const theme = useMemo(
        () => createTheme({
            palette: {
                mode
            },
            components: {
                MuiLink: {
                    defaultProps: {
                        component: LinkBehavior,
                    } as LinkProps,
                },
                MuiButtonBase: {
                    defaultProps: {
                        LinkComponent: LinkBehavior,
                    },
                },
            },
            spacing: 8,
        }),
        [mode],
    );

    return <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
                    <CssBaseline enableColorScheme />
                    <SuspenseWrapper>
                        <EnvContextProvider>
                            <UserContextProvider>
                                <RouterProvider router={router} />
                            </UserContextProvider>
                        </EnvContextProvider>
                    </SuspenseWrapper>
                </LocalizationProvider>
            </ThemeProvider>
        </ThemeContext.Provider>
    </QueryClientProvider>
}