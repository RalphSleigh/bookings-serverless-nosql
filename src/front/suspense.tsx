import { Box, CircularProgress } from "@mui/material";
import React from "react";

export function SuspenseWrapper(props) {
    return <React.Suspense fallback={<Loader />}>
        {props.children}
    </React.Suspense>
}

export function SuspenseElement(props) {
    return <React.Suspense fallback={<SmallLoader />}>
        {props.children}
    </React.Suspense>
}

function Loader() {
    return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexGrow: 1 }}><CircularProgress /></Box>
}

function SmallLoader() {
    return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexGrow: 1 }}><CircularProgress /></Box>
}