import React from 'react';
import { Button as MuiButton } from '@mui/material';

// A simple wrapper component for MUI Button with some default styling
export const Button = ({ children, className, variant, size, ...props }) => {
  return (
    <MuiButton
      variant={variant || "contained"}
      size={size || "medium"}
      className={className}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button; 