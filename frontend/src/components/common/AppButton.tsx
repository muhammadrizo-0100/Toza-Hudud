import React from 'react';
import { Button, IconButton, ButtonProps } from '@mui/material';

export interface AppButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'action' | 'danger' | 'ghost' | 'close';
  shape?: 'rounded' | 'pill' | 'square' | 'icon';
}

const variantToMui = {
  primary: 'contained',
  secondary: 'outlined',
  action: 'text',
  danger: 'outlined',
  ghost: 'text',
  close: 'text'
} as const;

const colorToMui = {
  primary: 'primary',
  secondary: 'inherit',
  action: 'primary',
  danger: 'error',
  ghost: 'inherit',
  close: 'inherit'
} as const;

export default function AppButton({
  variant = 'secondary',
  shape = 'rounded',
  className = '',
  children = null,
  sx = undefined,
  ...props
}: AppButtonProps) {
  const muiVariant = variantToMui[variant] || 'outlined';
  const muiColor = colorToMui[variant] || 'primary';
  const baseSx = {
    borderRadius: shape === 'pill' ? '999px' : shape === 'square' ? 0 : 2.5,
    fontWeight: 700,
    textTransform: 'none',
    ...(variant === 'danger' ? { borderColor: 'error.main', color: 'error.main' } : {}),
    ...(variant === 'ghost' ? { color: 'text.secondary' } : {}),
    ...(shape === 'icon' ? { minWidth: 36, width: 36, height: 36, p: 0 } : {})
  };

  if (shape === 'icon' || variant === 'close') {
    const { onClick, disabled } = props;
    return (
      <IconButton
        onClick={onClick}
        disabled={disabled}
        className={className}
        color={muiColor}
        sx={{ ...baseSx, ...(sx as object) }}
      >
        {children}
      </IconButton>
    );
  }

  return (
    <Button
      type="button"
      {...props}
      className={className}
      variant={muiVariant}
      color={muiColor}
      sx={{ minHeight: 40, px: 2, ...baseSx, ...(sx as object) }}
    >
      {children}
    </Button>
  );
}
