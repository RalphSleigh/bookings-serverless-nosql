import { Box, CircularProgress } from "@mui/material";
import React from "react";

export function SuspenseWrapper(props) {
    return <React.Suspense fallback={<Loader />}>
        {props.children}
    </React.Suspense>
}

function Loader() {
    return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><CircularProgress /></Box>
}