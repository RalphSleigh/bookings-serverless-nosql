import { Avatar, AvatarGroup, Box } from "@mui/material"
import React from "react"

export const applicationTypeIcon = type => {
    if (type === "group") return <div>
        <Box sx={{ display: "flex" }}>
            <AvatarGroup spacing="small" >
                <Avatar sx={{ width: "24px", height: "24px" }}></Avatar>
                <Avatar sx={{ width: "24px", height: "24px" }}></Avatar>
                <Avatar sx={{ width: "24px", height: "24px" }}></Avatar>
                <Avatar sx={{ width: "24px", height: "24px" }}></Avatar>
            </AvatarGroup>
        </Box>
        <Box sx={{ display: "flex", flexGrow: 1 }}></Box>
    </div>
    else return <Avatar sx={{ width: "24px", height: "24px" }}></Avatar>
}