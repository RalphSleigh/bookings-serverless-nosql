import React from 'react';
import { Typography } from '@mui/material';

//@ts-ignore
export const Footer = () => <footer><Typography sx={{ textAlign: 'center', p: 1 }} variant='subtitle2'>&copy; 2024 <a href="https://www.woodcraft.org.uk/">Woodcraft Folk</a>, Source on <a href="https://github.com/RalphSleigh/bookings-serverless-nosql">Github</a>. Built {BUILDATE}</Typography>
</footer>
