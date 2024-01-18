import React from "react";
import { JsonEventType, JsonParticipantType, JsonParticipantWithBasicType } from "../../../lambda-common/onetable.js";
import { Box, Grid, List, ListItem, Paper, Typography } from "@mui/material";
import { groupParticipants } from "../../../shared/woodcraft.js";

function QuickListElement({ participants, event }: { participants: Partial<JsonParticipantType>[], event: JsonEventType }) {

    const wholeParticipants = participants.filter(p => p.basic?.name && p.basic?.dob) as JsonParticipantWithBasicType[]
    const groups = groupParticipants(wholeParticipants, event) 

    const lists = groups.map((group, i) => {

        const items = group.participants.map((participant, i) => {
            const originalIndex = participants.findIndex(p => p.basic?.name === participant.basic?.name)
            return <ListItem disablePadding key={i}><a href={`#P${originalIndex}`}>{participant.basic?.name}</a></ListItem>
        })

        if(items.length === 0) return null
        
        return <Box key={i}>
            <Typography variant="subtitle1">{group.group.name}</Typography>
            <List>
            {items}
            </List>
        </Box>
    })

    return (<Grid sm={3} xs={12} item>
        <Paper elevation={3} sx={{position: "sticky", top: 18, p:2}}>
            {lists}
        </Paper >
    </Grid>)
}

export const QuickList = React.memo(QuickListElement)