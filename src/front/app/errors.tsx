import React, { useEffect } from "react";
import { Navigate, useLocation, useRouteError } from "react-router-dom";
import { SnackBarContext } from "./toasts.js";

function logError(message, stack) {
    try {
        const jsonMessage = {
            message: message,
            stack: stack
        };

        const jsonString = JSON.stringify(jsonMessage);

        const options: RequestInit = {
            method: 'POST',
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            credentials: "same-origin",
            body: jsonString
        }

        fetch('/api/error', options)
    } catch (e) {
        console.error(e)
        // ah well we tried
    }
}

export function RouterErrorBoundary() {
    let error = useRouteError() as any
    useEffect(() => {
        console.log("LOGGING FROM ROUTER ERROR BOUNDARY")
        logError(error, "")
    }, [error])

    const setSnackbar = React.useContext(SnackBarContext)

    const location = useLocation()
    if (location.pathname !== "/") {
        if (error.response?.status === 401) {
            useEffect(() => {
                setSnackbar({ message: `Permission Denied: ${error.response.data.message}`, severity: 'warning' })
            })
            return <Navigate to='/' />
        }
    }
    return <div>Oops, something went wrong, maybe <a href="/">refreshing</a> the page will help</div>
}

export class ReactErrorBoundary extends React.Component<{ children }, { hasError: boolean }> {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // Example "componentStack":
        //   in ComponentThatThrows (created by App)
        //   in ErrorBoundary (created by App)
        //   in div (created by App)
        //   in App
        console.log("LOGGING FROM ERROR BOUNDARY")
        logError(error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return <div>Oops, something went wrong, maybe <a href="/">refreshing</a> the page will help</div>
        }

        return this.props.children;
    }
}