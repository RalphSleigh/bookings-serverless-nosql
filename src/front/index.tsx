import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/index.js'

const domNode = document.getElementById('root');
const root = createRoot(domNode);
root.render(<App />);