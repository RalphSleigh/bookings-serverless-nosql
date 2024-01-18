import React, { useEffect } from "react";
import { useRouteError } from "react-router-dom";

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
    let error = useRouteError();
    useEffect(() => {
        logError(error, "")
    }, [error])
    return <div>Oops, something went wrong, maybe <a href="/">refreshing</a> the page will help</div>
}

export class ReactErrorBoundary extends React.Component<{children}, { hasError: boolean }> {
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