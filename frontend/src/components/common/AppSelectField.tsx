import React, { useState, useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
  TextField,
  Box,
  Typography,
  InputAdornment
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

export interface AppSelectFieldProps extends Omit<SelectProps<string | number>, 'label' | 'variant'> {
  label?: string;
  options?: SelectOption[];
  searchable?: boolean;
}

export const AppSelectField: React.FC<AppSelectFieldProps> = ({
  label,
  options = [],
  searchable = false,
  error = false,
  sx,
  value,
  ...props
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [open, setOpen] = useState(false);

  const shouldShowSearch = searchable || options.length > 7;

  const filteredOptions = useMemo(() => {
    if (!shouldShowSearch || !searchValue) return options;
    const lower = searchValue.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, searchValue, shouldShowSearch]);

  const selectedValueStr = String(value ?? '');

  return (
    <FormControl fullWidth size="small" error={error} sx={{ minWidth: 140, ...sx }}>
      {label && (
        <InputLabel shrink sx={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>
          {label}
        </InputLabel>
      )}
      <Select<string | number>
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => {
          setOpen(false);
          setSearchValue('');
        }}
        displayEmpty
        notched={Boolean(label)}
        label={label || undefined}
        value={value ?? ''}
        IconComponent={(iconProps) => (
          <KeyboardArrowDownIcon
            {...iconProps}
            sx={{
              color: '#64748B',
              fontSize: 20,
              mr: 0.5,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        )}
        renderValue={(selected) => {
          const normalized = String(selected ?? '');
          const matched = options.find((opt) => String(opt.value) === normalized);
          if (matched) {
            return (
              <StackValue label={matched.label} icon={matched.icon} />
            );
          }
          if (selected === '' && options.length > 0 && options[0].value === '') {
            return <span style={{ color: '#94A3B8' }}>{options[0].label}</span>;
          }
          return String(selected ?? '');
        }}
        MenuProps={{
          disableScrollLock: false,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left'
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left'
          },
          PaperProps: {
            elevation: 0,
            onWheel: (e: React.WheelEvent<HTMLDivElement>) => {
              const el = e.currentTarget;
              const atTop = el.scrollTop <= 0 && e.deltaY < 0;
              const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
              if (atTop || atBottom || el.scrollHeight <= el.clientHeight) {
                e.preventDefault();
              }
              e.stopPropagation();
            },
            sx: {
              mt: 0.75,
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12), 0 4px 8px rgba(15, 23, 42, 0.04)',
              p: 0.75,
              maxHeight: 290,
              minWidth: 180,
              bgcolor: '#FFFFFF',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              touchAction: 'pan-y',
              '& .MuiList-root': {
                p: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                overscrollBehavior: 'contain'
              },
              '&::-webkit-scrollbar': {
                width: 5
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#CBD5E1',
                borderRadius: 3
              }
            }
          },
          ...props.MenuProps
        }}
        sx={{
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '0.875rem',
          height: 40,
          bgcolor: '#FFFFFF',
          '& fieldset': {
            borderColor: '#E2E8F0',
            borderRadius: '10px'
          },
          '&:hover fieldset': {
            borderColor: '#CBD5E1'
          },
          '&.Mui-focused fieldset': {
            borderColor: '#059669',
            borderWidth: '1.5px'
          },
          ...props.sx
        }}
        {...props}
      >
        {/* Search Field inside Popover */}
        {shouldShowSearch && (
          <Box
            sx={{
              p: 1,
              pb: 0.75,
              position: 'sticky',
              top: 0,
              bgcolor: '#FFFFFF',
              zIndex: 2,
              borderBottom: '1px solid #F1F5F9'
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Qidirish..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  bgcolor: '#F8FAFC',
                  fontSize: '0.825rem',
                  height: 34,
                  '& fieldset': { borderColor: '#E2E8F0' }
                }
              }}
            />
          </Box>
        )}

        {filteredOptions.length === 0 ? (
          <Box sx={{ py: 2, px: 2, textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
            Natija topilmadi
          </Box>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = selectedValueStr === String(opt.value);
            return (
              <MenuItem
                key={String(opt.value)}
                value={opt.value}
                sx={{
                  borderRadius: '10px',
                  py: 1,
                  px: 1.5,
                  my: 0.25,
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: isSelected ? '#ECFDF5 !important' : 'transparent',
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    bgcolor: isSelected ? '#D1FAE5 !important' : '#F8FAFC !important'
                  }
                }}
              >
                {/* Clean Radio-like Circular Indicator (Exact Image 2 Style) */}
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: isSelected ? '2px solid #059669' : '2px solid #CBD5E1',
                    bgcolor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#059669'
                      }}
                    />
                  )}
                </Box>

                {opt.icon && (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: isSelected ? '#059669' : '#64748B' }}>
                    {opt.icon}
                  </Box>
                )}

                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#065F46' : '#1E293B',
                    flexGrow: 1
                  }}
                >
                  {opt.label}
                </Typography>
              </MenuItem>
            );
          })
        )}
      </Select>
    </FormControl>
  );
};

const StackValue: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>}
    <span>{label}</span>
  </Box>
);

export default AppSelectField;
