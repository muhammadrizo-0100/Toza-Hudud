import React, { useRef } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { formatUzPhone } from '../../utils/phone';

export interface AppPhoneFieldProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const AppPhoneField: React.FC<AppPhoneFieldProps> = ({
  value = '+998 ',
  onChange,
  onKeyDown,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Guarantee +998 is always present
  const displayValue = value && value.startsWith('+998') ? value : formatUzPhone(value || '');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    const input = e.currentTarget;
    const { selectionStart, selectionEnd } = input;
    const currentVal = input.value;

    if (selectionStart === null || selectionEnd === null) return;

    // RULE 1: +998 (index 0 to 5) CANNOT be deleted
    if (e.key === 'Backspace') {
      if (selectionStart <= 5 && selectionEnd <= 5) {
        e.preventDefault();
        return;
      }

      // If user selected all (Ctrl+A) and pressed Backspace, preserve '+998 '
      if (selectionStart === 0 && selectionEnd === currentVal.length) {
        e.preventDefault();
        onChange('+998 ');
        return;
      }

      // If deleting a non-digit symbol (-, ), (, or space)
      const prevChar = currentVal[selectionStart - 1];
      if (prevChar === '-' || prevChar === ')' || prevChar === '(' || prevChar === ' ') {
        e.preventDefault();
        // Find preceding digit to delete (must be after '+998 ' prefix)
        let digitIdx = selectionStart - 1;
        while (digitIdx >= 5 && /\D/.test(currentVal[digitIdx])) {
          digitIdx--;
        }
        if (digitIdx >= 5) {
          const rawWithoutDigit = currentVal.slice(0, digitIdx) + currentVal.slice(digitIdx + 1);
          const nextFormatted = formatUzPhone(rawWithoutDigit);
          onChange(nextFormatted);

          setTimeout(() => {
            if (inputRef.current) {
              const newPos = Math.max(5, Math.min(digitIdx, nextFormatted.length));
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
        return;
      }
    } else if (e.key === 'Delete') {
      // Cannot delete +998 prefix characters
      if (selectionStart < 5) {
        e.preventDefault();
        return;
      }

      if (selectionStart === 0 && selectionEnd === currentVal.length) {
        e.preventDefault();
        onChange('+998 ');
        return;
      }

      const nextChar = currentVal[selectionStart];
      if (nextChar === '-' || nextChar === ')' || nextChar === '(' || nextChar === ' ') {
        e.preventDefault();
        let digitIdx = selectionStart;
        while (digitIdx < currentVal.length && /\D/.test(currentVal[digitIdx])) {
          digitIdx++;
        }
        if (digitIdx < currentVal.length) {
          const rawWithoutDigit = currentVal.slice(0, digitIdx) + currentVal.slice(digitIdx + 1);
          const nextFormatted = formatUzPhone(rawWithoutDigit);
          onChange(nextFormatted);

          setTimeout(() => {
            if (inputRef.current) {
              const newPos = Math.max(5, Math.min(selectionStart, nextFormatted.length));
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
        return;
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (!raw.startsWith('+998')) {
      raw = '+998 ' + raw.replace(/^\+?9?9?8?/, '');
    }
    const formatted = formatUzPhone(raw);
    onChange(formatted);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    props.onFocus?.(e);
    if (!value || value.trim() === '' || value === '+998' || value === '+998 ') {
      onChange('+998 ');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(5, 5);
        }
      }, 0);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    props.onClick?.(e);
    const start = e.currentTarget.selectionStart;
    if (start !== null && start < 5) {
      setTimeout(() => {
        if (inputRef.current) {
          const curLen = inputRef.current.value.length;
          const target = Math.max(5, curLen);
          inputRef.current.setSelectionRange(target, target);
        }
      }, 0);
    }
  };

  return (
    <TextField
      inputRef={inputRef}
      placeholder="+998 (90) 123-45-67"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onClick={handleClick}
      size="small"
      fullWidth
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '10px',
          bgcolor: '#FFFFFF',
          '& fieldset': { borderColor: '#E2E8F0' },
          '&:hover fieldset': { borderColor: '#CBD5E1' },
          '&.Mui-focused fieldset': { borderColor: '#059669' }
        },
        ...props.sx
      }}
      {...props}
    />
  );
};

export default AppPhoneField;
