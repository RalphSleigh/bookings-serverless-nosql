import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, useMediaQuery, Box } from '@mui/material';
import { useMemo, useState } from 'react';
import { ThemeContext } from './themeContext.js';
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
import { EnsureLoggedInRoute } from '../permissions.js';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { EditEventLoader } from '../event/editLoader.js';
import enGB from 'date-fns/locale/en-GB';
import { CreateBookingLoader } from '../booking/createLoader.js';
import { EditOwnBookingLoader } from '../booking/editOwnBookingLoader.js';
import { UserPage } from '../user/userPage.js';
import { ThanksLoader } from '../booking/thanksLoader.js';
import { ReactErrorBoundary, RouterErrorBoundary } from './errors.js';
import { SnackBarProvider } from './toasts.js';
import { EditBookingLoader } from '../booking/editBookingLoader.js';
import { ViewOwnBookingLoader } from '../booking/viewOwnBookingLoader.js';
import { Footer } from './footer.js';
import { ApplyLoader } from '../booking/applyLoader.js';
import { ApplyThanksLoader } from '../booking/applyThanksLoader.js';
import { useStickyState } from '../util.js';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
            retry: (failureCount, error) => {//@ts-ignore
                if (error.response && error.response.status === 401) return false
                if (failureCount > 2) return false
                return true
            }
        }
    },
})

const router = createBrowserRouter([{
    element: <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
        <AppToolbar />
        <Box sx={{ flexGrow: 1 }}>
            <SuspenseWrapper><Outlet /></SuspenseWrapper>
        </Box>
        <Footer />
    </Box>,
    errorElement: <RouterErrorBoundary />,
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
                path: "user",
                element: <UserPage />
            }, {
                path: "event/create",
                element: <CreateEventPage />
            }, {
                path: "event/:eventId/edit",
                element: <EditEventLoader />,
            }, {
                path: "event/:eventId/apply",
                element: <ApplyLoader />,
            }, {
                path: "event/:eventId/applicationthanks",
                element: <ApplyThanksLoader />,
            }, {
                path: "event/:eventId/book",
                element: <CreateBookingLoader />,
            }, {
                path: "event/:eventId/edit-my-booking",
                element: <EditOwnBookingLoader />,
            }, {
                path: "event/:eventId/view-my-booking",
                element: <ViewOwnBookingLoader />,
            }, {
                path: "event/:eventId/edit-booking/:userId",
                element: <EditBookingLoader />,
            }, {
                path: "event/:eventId/thanks",
                element: <ThanksLoader />,
            }, {
                lazy: () => import('../manage/manageLoader.js'),
                children: [{
                    path: "event/:eventId/manage",
                    lazy: () => import('../manage/managePage.js'),
                    children: [{
                        index: true,
                        lazy: () => import('../manage/participants.js')
                    }, {
                        path: "participants",
                        lazy: () => import('../manage/participants.js')
                    }, {
                        path: "bookings",
                        lazy: () => import('../manage/bookings.js')
                    },
                    {
                        path: "bookings/history/:userId",
                        lazy: () => import('../manage/bookingHistory.js')
                    },
                    {
                        path: "applications",
                        lazy: () => import('../manage/applications.js')
                    }, {
                        path: "kp",
                        lazy: () => import('../manage/kp.js')
                    }, {
                        path: "roles",
                        lazy: () => import('../manage/roles.js')
                    }, {
                        path: "money",
                        lazy: () => import('../manage/money.js')
                    }, {
                        path: "emails",
                        lazy: () => import('../manage/comms.js')
                    }, {
                        path: "villages",
                        lazy: () => import('../manage/villages.js')
                    }, {
                        path: "birthdays",
                        lazy: () => import('../manage/birthdays.js')
                    }, {
                        path: "graphs",
                        lazy: () => import('../manage/graphs.js')
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

const themeDef = mode => ({
    palette: {
        mode, ...(mode === "light" ? {} : {
            primary: {
                main: '#1976d2',
            },
            secondary: {
                main: '#9c27b0',
            },
            background: {
                default: '#030412',
                paper: '#030412',
            },
            text: {
                primary: 'rgba(255,255,255,0.9)',
            },
        })
    }
})

export function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useStickyState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light', "color-mode");
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
            ...themeDef(mode),
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
                },//@ts-ignore
                MuiDataGrid: {
                    styleOverrides: {
                        root: {
                            '.participant-row-deleted-true': {
                                opacity: 0.5,
                            },
                            '& .MuiDataGrid-cell:focus': {
                                outline: 'none'
                            },
                            '& .MuiDataGrid-cell:focus-within': {
                                outline: 'none'
                            },
                            '& .MuiDataGrid-row:hover': {
                                cursor: 'pointer'
                            }
                        },
                    }
                },
                MuiTableCell: {
                    styleOverrides: {
                        root: {
                            "& .hidden-button": {
                                opacity: 0
                            },
                            "&:hover .hidden-button": {
                                opacity: 1
                            }
                        }
                    }
                }
            },
            spacing: 8,
        }),
        [mode],
    );

    return <ReactErrorBoundary>
        <QueryClientProvider client={queryClient}>
            <ThemeContext.Provider value={colorMode}>
                <ThemeProvider theme={theme}>
                    <CssBaseline enableColorScheme={true} />
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
                        <SuspenseWrapper>
                            <EnvContextProvider>
                                <UserContextProvider>
                                    <SnackBarProvider>
                                        <RouterProvider router={router} />
                                    </SnackBarProvider>
                                </UserContextProvider>
                            </EnvContextProvider>
                        </SuspenseWrapper>
                    </LocalizationProvider>
                </ThemeProvider>
            </ThemeContext.Provider>
        </QueryClientProvider>
    </ReactErrorBoundary >
}
