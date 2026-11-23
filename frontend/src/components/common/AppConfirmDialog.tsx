import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export interface AppConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const AppConfirmDialog: React.FC<AppConfirmDialogProps> = ({
  open,
  title = 'O‘chirishni tasdiqlash',
  message,
  confirmLabel = 'O‘chirish',
  cancelLabel = 'Bekor qilish',
  severity = 'danger',
  loading = false,
  onConfirm,
  onClose
}) => {
  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <WarningAmberOutlinedIcon sx={{ fontSize: 20 }} />;
      case 'info':
        return <InfoOutlinedIcon sx={{ fontSize: 20 }} />;
      default:
        return <DeleteOutlineOutlinedIcon sx={{ fontSize: 20 }} />;
    }
  };

  const getColors = () => {
    switch (severity) {
      case 'warning':
        return { bg: '#FEF3C7', color: '#D97706', btnBg: '#D97706', btnHover: '#B45309' };
      case 'info':
        return { bg: '#E0F2FE', color: '#0284C7', btnBg: '#0284C7', btnHover: '#0369A1' };
      default:
        return { bg: '#FEE2E2', color: '#DC2626', btnBg: '#DC2626', btnHover: '#B91C1C' };
    }
  };

  const colors = getColors();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          p: 1.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.16)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: colors.bg,
              color: colors.color,
              display: 'grid',
              placeItems: 'center'
            }}
          >
            {getIcon()}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
            {title}
          </Typography>
        </Stack>
        <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: '#94A3B8' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.5 }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 2, pt: 0.5, pb: 1, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            flex: 1,
            height: 40,
            borderRadius: '10px',
            color: '#64748B',
            borderColor: '#E2E8F0',
            fontWeight: 600,
            fontSize: '0.88rem',
            textTransform: 'none',
            '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{
            flex: 1,
            height: 40,
            borderRadius: '10px',
            bgcolor: colors.btnBg,
            fontWeight: 600,
            fontSize: '0.88rem',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { bgcolor: colors.btnHover, boxShadow: 'none' }
          }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppConfirmDialog;
