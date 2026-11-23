import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  IconButton,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useTranslation } from '../i18n';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, onClose, onConfirm }) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: '#FEE2E2',
              color: '#DC2626',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <LogoutOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
            {t('nav.logoutConfirmTitle')}
          </Typography>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, py: 2 }}>
        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
          {t('nav.logoutConfirmDesc')}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 2, pt: 0.5, pb: 1.5, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
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
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          sx={{
            flex: 1,
            height: 40,
            borderRadius: '10px',
            bgcolor: '#DC2626',
            fontWeight: 700,
            fontSize: '0.88rem',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#B91C1C', boxShadow: 'none' }
          }}
        >
          {t('nav.logout')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
