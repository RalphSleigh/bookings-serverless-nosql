import { createContext } from 'react';


export const ThemeContext = createContext<{mode: string, toggleColorMode: () => void}>({mode: "light", toggleColorMode: () => {}});


