import { useContext } from "react";
import { UserContext } from "./user/userContext.js";
import { IsGlobalAdmin } from "../shared/permissions.js";
import { Navigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import React from "react";

export function IfHasPermission({permission, children, ...props}) {
    if(!props.user) props.user = useContext(UserContext)
    return permission.if(props) ? children: null
}

export function EnsureHasPermission({permission, children, ...props}) {
    if(!props.user) props.user = useContext(UserContext)
    return permission.if(props) ? children: <Navigate to='/login' />
}

export function IfGlobalAdmin(props) {
    const user = useContext(UserContext)
    return IsGlobalAdmin.if({user}) ? props.children : null
}

export function EnsureLoggedInRoute(props) {
    const user = useContext(UserContext)
    if(!user) return <Navigate to='/login' />
    return <Outlet />
}