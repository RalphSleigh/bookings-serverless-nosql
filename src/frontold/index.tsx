//import 'bootstrap/dist/css/bootstrap.css';
import './lib/react-selectize/index.css';

import * as React from 'react';
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import Routes from '../frontold/routes'

import {createStore, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk';
import * as Immutable from 'immutable'
import { combineReducers } from 'redux-immutable';
import {ConnectedRouter, routerReducer, routerMiddleware} from 'react-router-redux'
import * as History from 'history'

import fetch from '../frontold/fetch'

import * as user from '../frontold/user'
import * as messages from '../frontold/messages'
import * as events from '../frontold/events'
import * as bookings from '../frontold/bookings'

import { storageFactory } from "storage-factory";
//@ts-ignore
const local = storageFactory(() => localStorage);

function get_theme(): string {
    const stored = local.getItem("theme")
    if(stored) return stored

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return "dark"
    }

    return "light"
}
//@ts-ignore
const all_css = [...document.styleSheets]

if(get_theme() === "dark") {
    all_css.filter(s => s.href && s.href.includes("light")).forEach(s => {
        s.disabled = true
        s.media="NOT_ALL"
    })
    all_css.filter(s => s.href && s.href.includes("dark")).forEach(s => {
        s.disabled = false
        s.media="ALL"
    })
} else {
    all_css.filter(s => s.href && s.href.includes("light")).forEach(s => {
        s.disabled = false
        s.media="ALL"
    })
    all_css.filter(s => s.href && s.href.includes("dark")).forEach(s => {
        s.disabled = true
        s.media="NOT_ALL"
    })
}

document.styleSheets[2].disabled = true

const history = History.createBrowserHistory()

const middleware = routerMiddleware(history);

class ErrorBoundary extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // You can also log the error to an error reporting service
        try {
            const jsonMessage = {
                message: error.message,
                file: '',
                line: 0,
                column: 0,
                stack: info.componentStack,
                location: window.location.href
            };

            const jsonString = JSON.stringify(jsonMessage);

            const options = {
                method: 'POST',
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                credentials: "same-origin",
                body: jsonString
            };
            // @ts-ignore
            window.fetch('/api/error', options)
        } catch (e) {
            console.error(e)
            // ah well we tried
        }
    }

    render() {
        if (this.state.hasError) {
            return <p>Something went wrong, refreshing the page may help.</p>;
        }

        return this.props.children;
    }
}

const appReducer = (state = 'dev', action) => {
    switch (action.type) {
        case 'APP_UPDATE_ENV':
            return action.env;
    }
    return state;
};


const rootReducer = combineReducers({
    App: appReducer,
    User: user.reducer,
    Messages: messages.reducer,
    Events: events.reducer,
    Bookings: bookings.reducer,
    router: routerReducer
});

// @ts-ignore
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(rootReducer, Immutable.Map(), composeEnhancers(applyMiddleware(thunk, middleware)));
const provider = <Provider store={store}><ConnectedRouter history={history}>{Routes}</ConnectedRouter></Provider>;

//console.log( document.getElementById('root'));

/*****************************
 * This following line is very very bad but we want to be able to dispatch from fetch...
 *****************************/

// @ts-ignore
window.dispatch = store.dispatch;




render(<ErrorBoundary>{provider}</ErrorBoundary>, document.getElementById('root'));

let hidden, visibilityChange;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
    visibilityChange = "visibilitychange";
} else { // @ts-ignore
    if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else { // @ts-ignore
        if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
            visibilityChange = "webkitvisibilitychange";
        }
    }
}

if (!(typeof document.addEventListener === "undefined" || hidden === undefined)) {
    document.addEventListener(visibilityChange, () => {
        console.log(`Visibility change ${document[hidden]} ${document.visibilityState}`);
        if (!document[hidden]) {
            // @ts-ignore
            dispatch(user.actions.getUser())
        }
    }, false);
}

setInterval(() => {
    if (!document[hidden]) {
        // @ts-ignore
        dispatch(user.actions.getUser())
    }
}, 180000)

// @ts-ignore
fetch('/api/env', "GET").then(j => dispatch({type: 'APP_UPDATE_ENV', env: j.env}));