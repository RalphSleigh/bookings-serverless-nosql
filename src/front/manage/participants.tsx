import React from "react";
import { useOutletContext } from "react-router-dom";
import { manageContext } from "./manageLoader.js";

export function Component() {
    const { event, bookings } = useOutletContext<manageContext>()

    const participants = bookings.reduce<any[]>((a, c) => {
        return [...a, ...c.participants]
    }, []).map((p, i) => <p key={i}>{p.basic.name}</p>)

    return <>
        {participants}
    </>
}