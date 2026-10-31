import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  IconButton,
  Divider,
  Button,
  Card,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import AppSelectField from '../common/AppSelectField';

import { StatusBadge } from '../common/StatusBadge';
import { RequestItem, Worker } from '../../types';
import {
  useAssignWorkerMutation,
  useVerifyWorkMutation,
  useRejectWorkMutation
} from '../../api/requestsApi';

interface RequestDetailDrawerProps {
  request: RequestItem | null;
  workers?: Worker[];
  open: boolean;
  onClose: () => void;
}

export const RequestDetailDrawer: React.FC<RequestDetailDrawerProps> = ({
  request,
  workers = [],
  open,
  onClose
}) => {
  const [assignWorker, { isLoading: isAssigning }] = useAssignWorkerMutation();
  const [verifyWork, { isLoading: isVerifying }] = useVerifyWorkMutation();
  const [rejectWork, { isLoading: isRejecting }] = useRejectWorkMutation();

  const [selectedWorkerId, setSelectedWorkerId] = useState<number | ''>('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!request) return null;

  const handleAssign = async () => {
    if (!selectedWorkerId) return;
    try {
      await assignWorker({ id: request.id, workerId: Number(selectedWorkerId) }).unwrap();
      setSelectedWorkerId('');
    } catch (err) {
      console.error('Assign failed', err);
    }
  };

  const handleVerify = async () => {
    try {
      await verifyWork(request.id).unwrap();
    } catch (err) {
      console.error('Verify failed', err);
    }
  };

  const handleReject = async () => {
    try {
      await rejectWork({ id: request.id, reason: rejectReason }).unwrap();
      setRejectDialogOpen(false);
      setRejectReason('');
    } catch (err) {
      console.error('Reject failed', err);
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 540 },
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }
        }}
      >
        {/* Drawer Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Murojaat #{request.id}
            </Typography>
            <StatusBadge status={request.status} />
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider />

        {/* Photos Section: Before and After side-by-side */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            FOTOHISOBOT (CHIQINDI HOLATI)
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: request.afterPhotoUrl ? { xs: '1fr', sm: '1fr 1fr' } : '1fr',
              gap: 2
            }}
          >
            {/* Before Photo */}
            <Card sx={{ border: '2px solid #FEE2E2', borderRadius: 2.5, overflow: 'hidden' }}>
              <Box sx={{ p: 1, bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>
                MUAMMO (OLDIN)
              </Box>
              <CardMedia
                component="img"
                height="190"
                image={request.beforePhotoUrl}
                alt="Chiqindi holati"
                sx={{ objectFit: 'cover' }}
              />
            </Card>

            {/* After Photo (if worker uploaded) */}
            {request.afterPhotoUrl && (
              <Card sx={{ border: '2px solid #D1FAE5', borderRadius: 2.5, overflow: 'hidden' }}>
                <Box sx={{ p: 1, bgcolor: '#D1FAE5', color: '#059669', fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>
                  TOZALANDI (KEYIN)
                </Box>
                <CardMedia
                  component="img"
                  height="190"
                  image={request.afterPhotoUrl}
                  alt="Tozalangan holat"
                  sx={{ objectFit: 'cover' }}
                />
              </Card>
            )}
          </Box>
        </Box>

        {/* Details Grid */}
        <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PlaceOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2" fontWeight={600}>
                {request.mahallaName || 'Mahalla ko‘rsatilmagan'} — {request.address || 'Mo‘ljalsiz'}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <PersonOutlineIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                Fuqaro: <strong>{request.citizenFullName || 'Aholi'}</strong>
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                Telefon: <strong>{request.citizenPhone || 'Ko‘rsatilmagan'}</strong>
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                Kelib tushgan: {new Date(request.createdAt).toLocaleString('uz-UZ')}
              </Typography>
            </Stack>

            {request.description && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Izoh:
                </Typography>
                <Typography variant="body2">{request.description}</Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Worker Info if already assigned */}
        {request.assignedWorker && (
          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              BIRIKTIRILGAN BRIGADA / XODIM:
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>
              {request.assignedWorker.fullName} ({request.assignedWorker.vehicleNumber || 'Texnika'})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Aloqa: {request.assignedWorker.phone}
            </Typography>
          </Box>
        )}

        {/* Action Controls based on Status */}
        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #E2E8F0' }}>
          {request.status === 'new' && (
            <Stack spacing={1.5}>
              <AppSelectField
                label="Xodim/Haydovchini tanlang"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
                options={workers.map((w) => ({
                  value: w.id,
                  label: `${w.fullName} — ${w.vehicleNumber || 'Mashina raqamsiz'} (${w.phone})`
                }))}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={!selectedWorkerId || isAssigning}
                onClick={handleAssign}
                startIcon={<EngineeringOutlinedIcon />}
              >
                {isAssigning ? <CircularProgress size={20} /> : 'Xodimga biriktirish'}
              </Button>
            </Stack>
          )}

          {request.status === 'submitted' && (
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleVerify}
                disabled={isVerifying}
                startIcon={<CheckCircleOutlineIcon />}
                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
              >
                {isVerifying ? <CircularProgress size={20} /> : 'Ishni tasdiqlash va Yopish'}
              </Button>

              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => setRejectDialogOpen(true)}
                startIcon={<CancelOutlinedIcon />}
              >
                Qayta tozalashga yuborish / Rad etish
              </Button>
            </Stack>
          )}
        </Box>
      </Drawer>

      {/* Reject Modal */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Murojaatni rad etish</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rad etish sababi"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Chiqindi to‘liq tozalab olinmagan..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleReject} color="error" variant="contained" disabled={isRejecting}>
            Rad etish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
