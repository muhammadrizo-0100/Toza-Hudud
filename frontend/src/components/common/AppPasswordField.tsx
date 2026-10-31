import React, { useState } from 'react';
import {
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  OutlinedInputProps
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

interface AppPasswordFieldProps extends Omit<OutlinedInputProps, 'type' | 'onChange'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
}

export default function AppPasswordField({
  label = 'Parol',
  value,
  onChange,
  error = false,
  helperText = '',
  ...props
}: AppPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormControl variant="outlined" fullWidth error={error}>
      <InputLabel>{label}</InputLabel>
      <OutlinedInput
        {...props}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="parolni ko'rsatish"
              onClick={() => setShowPassword((prev) => !prev)}
              edge="end"
            >
              {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
            </IconButton>
          </InputAdornment>
        }
      />
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}
