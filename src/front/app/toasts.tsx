import { Alert, Snackbar } from "@mui/material"
import React, { createContext, useState } from "react";

export type SnackbarDataType = {
    message: string,
    severity: "success" | "info" | "warning" | "error"
}

export const SnackBarContext = createContext<(data: SnackbarDataType) => void>(data => { })

export function SnackBarProvider({ children }) {
    const [snackbar, setSnackbar] = useState<SnackbarDataType | undefined>(undefined)
    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }
    
        setSnackbar(undefined);
      };

    return (
        <SnackBarContext.Provider value={setSnackbar}>
            {children}
            {snackbar && <CustomSnackbar data={snackbar} open={true} autoHideDuration={6000} onClose={handleClose} />}
        </SnackBarContext.Provider>
    )
}

const CustomSnackbar: React.FC<{ data: SnackbarDataType, [key: string]: any }> = (props) => {
    const { data, onClose, ...rest } = props
    return (<Snackbar onClose={onClose} {...rest}>
        <Alert
            onClose={onClose}
            severity={data.severity}
            variant="filled"
            sx={{ width: '100%' }}
        >
            {data.message}
        </Alert>
    </Snackbar>)
}