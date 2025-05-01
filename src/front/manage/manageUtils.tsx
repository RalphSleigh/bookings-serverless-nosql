import { Avatar, Badge } from "@mui/material";
import { JsonUserType } from "../../lambda-common/onetable.js";
import React from "react";

export const WoodcraftAvatar: React.FC<{ user: JsonUserType }> = (props) => {
    const { user } = props;
  
    const badgeLetter = user.source.charAt(0).toUpperCase();
  
    let logoSrc = "/nope.jpg";
    if (user.isWoodcraft) {
      logoSrc = "/logo-avatar.png";
    } else if (user.source === "google") {
      logoSrc = "/logo-google.png";
    } else if (user.source === "apple") {
      logoSrc = "/logo-apple.png";
    } else if (user.source === "yahoo") {
      logoSrc = "/logo-yahoo.png";
    } else if (user.source === "microsoft") {
      logoSrc = "/logo-microsoft.png";
    }
  
    return <Badge
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        badgeContent={<Avatar alt="Account source" src={logoSrc} sx={{ width: 16, height: 16, border: "2px solid #fff" }} />}
      >
        <Avatar imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 26, height: 26, boxShadow: 5 }} alt={user.userName || ""} src={user.picture || "/nope.jpg"} />
      </Badge>
  };
  