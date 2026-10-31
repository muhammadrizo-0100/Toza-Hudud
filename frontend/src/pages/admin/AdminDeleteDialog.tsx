import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Box,
  IconButton,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AdminUser } from '../../types';

interface AdminDeleteDialogProps {
  open: boolean;
  admin: AdminUser | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export const AdminDeleteDialog: React.FC<AdminDeleteDialogProps> = ({
  open,
  admin,
  onClose,
  onConfirm,
  loading
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          p: 1,
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.14)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#0F172A' }}>
          Xodimni o‘chirish
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
          Haqiqatan ham <strong>{admin?.fullName || admin?.username}</strong> xodimining tizimdagi faoliyatini to‘xtatmoqchimisiz?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 2, pt: 1, pb: 1.5, gap: 1 }}>
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
          Bekor qilish
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{
            flex: 1,
            height: 40,
            borderRadius: '10px',
            bgcolor: '#DC2626',
            fontWeight: 600,
            fontSize: '0.88rem',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#B91C1C', boxShadow: 'none' }
          }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : 'O‘chirish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
