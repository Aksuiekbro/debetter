import React from 'react';
import { Card as MuiCard, CardContent as MuiCardContent } from '@mui/material';

export const Card = ({ children, className, ...props }) => {
  return (
    <MuiCard className={className} {...props}>
      {children}
    </MuiCard>
  );
};

export const CardContent = ({ children, className, ...props }) => {
  return (
    <MuiCardContent className={className} {...props}>
      {children}
    </MuiCardContent>
  );
};

export default Card; 