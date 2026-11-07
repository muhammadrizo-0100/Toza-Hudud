import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  CircularProgress,
  Typography,
  Alert,
  IconButton,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AppPasswordField from '../../components/common/AppPasswordField';
import { AppSelectField } from '../../components/common/AppSelectField';
import AppPhoneField from '../../components/common/AppPhoneField';
import { AdminUser, AdminRole, District } from '../../types';
import { useCreateAdminMutation, useUpdateAdminMutation } from '../../api/adminsApi';
import { cleanUzPhone, validateUzPhone } from '../../utils/phone';
import { useToast } from '../../context/ToastContext';

interface AdminFormDialogProps {
  open: boolean;
  editAdmin: AdminUser | null;
  onClose: () => void;
  districts: District[];
  currentUser?: AdminUser | null;
  onSuccess?: () => void;
}

const getDefaultJobTitle = (r: AdminRole): string => {
  switch (r) {
    case 'Manager':
      return 'Tuman tozalik bo‘limi boshlig‘i';
    case 'Dispatcher':
      return 'Tuman navbatchi dispetcheri';
    case 'Inspector':
      return 'Hudud nazoratchisi / Usta';
    case 'Driver':
      return 'Maxsus texnika haydovchisi';
    case 'SuperAdmin':
      return 'Viloyat bosh koordinatori';
    default:
      return '';
  }
};

export const AdminFormDialog: React.FC<AdminFormDialogProps> = ({
  open,
  editAdmin,
  onClose,
  districts,
  currentUser,
  onSuccess
}) => {
  const isManagerRole = currentUser?.role === 'Manager';
  const isSuperAdminRole = currentUser?.role === 'SuperAdmin';

  const [role, setRole] = useState<AdminRole>(isManagerRole ? 'Dispatcher' : 'Manager');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [districtId, setDistrictId] = useState<number | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const [createAdmin, { isLoading: isCreating }] = useCreateAdminMutation();
  const [updateAdmin, { isLoading: isUpdating }] = useUpdateAdminMutation();

  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      setApiError(null);
      setErrors({});
      if (editAdmin) {
        const adminRole = editAdmin.role || (isManagerRole ? 'Dispatcher' : 'Manager');
        setRole(adminRole);
        setFullName(editAdmin.fullName || '');
        setUsername(editAdmin.username || '');
        setPassword('');
        setPhone(editAdmin.phone || '');
        setJobTitle(editAdmin.jobTitle || getDefaultJobTitle(adminRole));
        setDistrictId(isManagerRole ? currentUser?.districtId || '' : editAdmin.districtId || '');
      } else {
        const initialRole: AdminRole = isManagerRole ? 'Dispatcher' : 'Manager';
        setRole(initialRole);
        setFullName('');
        setUsername('');
        setPassword('');
        setPhone('');
        setJobTitle(getDefaultJobTitle(initialRole));
        setDistrictId(isManagerRole ? currentUser?.districtId || '' : districts[0]?.id || '');
      }
    }
  }, [open, editAdmin, districts, isManagerRole, currentUser]);

  const handleRoleChange = (newRole: AdminRole) => {
    setRole(newRole);
    // Auto populate job title if not in edit mode, or if jobTitle is standard
    if (!editAdmin) {
      setJobTitle(getDefaultJobTitle(newRole));
    }
    if (newRole === 'SuperAdmin') {
      setDistrictId('');
    } else if (!districtId && districts.length > 0) {
      setDistrictId(districts[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      nextErrors.fullName = 'F.I.Sh. kiritilishi shart';
    }
    if (!username.trim()) {
      nextErrors.username = 'Foydalanuvchi nomi (login) kiritilishi shart';
    }
    if (!editAdmin) {
      if (!password) {
        nextErrors.password = 'Parol kiritilishi shart';
      } else if (password.length < 6) {
        nextErrors.password = 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak';
      }
    } else if (password && password.length < 6) {
      nextErrors.password = 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak';
    }

    if (phone.trim()) {
      const pVal = validateUzPhone(phone);
      if (!pVal.isValid) {
        nextErrors.phone = pVal.error || 'Telefon raqam noto‘g‘ri';
      }
    }

    const targetDistrictId = isManagerRole ? currentUser?.districtId : districtId;
    if (role !== 'SuperAdmin' && !targetDistrictId) {
      nextErrors.districtId = 'Tuman tanlanishi shart';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (editAdmin) {
        await updateAdmin({
          id: editAdmin.id,
          body: {
            username: username.trim().toLowerCase(),
            fullName: fullName.trim(),
            phone: phone.trim() ? cleanUzPhone(phone) : undefined,
            jobTitle: jobTitle.trim() || getDefaultJobTitle(role),
            password: password.trim() ? password.trim() : undefined,
            role: isManagerRole ? role : role,
            districtId: role === 'SuperAdmin' ? null : Number(targetDistrictId)
          }
        }).unwrap();
        showSuccess(`Xodim (${fullName.trim()}) ma’lumotlari yangilandi`);
      } else {
        await createAdmin({
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          phone: phone.trim() ? cleanUzPhone(phone) : undefined,
          jobTitle: jobTitle.trim() || getDefaultJobTitle(role),
          role: role,
          districtId: role === 'SuperAdmin' ? null : Number(targetDistrictId)
        }).unwrap();
        showSuccess(`Yangi xodim (${fullName.trim()}) muvaffaqiyatli qo‘shildi!`);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const errorMsg =
        typeof err === 'object' && err !== null && 'data' in err
          ? (err as { data: { message?: string } }).data?.message || 'Xatolik yuz berdi'
          : 'Server bilan aloqa uzildi';
      const msgStr = Array.isArray(errorMsg) ? errorMsg.join(', ') : String(errorMsg);
      setApiError(msgStr);
      showError(msgStr);
    }
  };

  const roleOptions = isManagerRole
    ? [
        { value: 'Dispatcher', label: 'Tuman Dispetcheri (Operator)' },
        { value: 'Inspector', label: 'Hudud nazoratchisi / Usta' },
        { value: 'Driver', label: 'Maxsus texnika haydovchisi' }
      ]
    : [
        { value: 'Manager', label: 'Tuman Tozalik Bo‘limi Boshlig‘i' },
        { value: 'Dispatcher', label: 'Tuman Dispetcheri (Operator)' },
        { value: 'Inspector', label: 'Hudud nazoratchisi / Usta' },
        { value: 'Driver', label: 'Maxsus texnika haydovchisi' },
        ...(isSuperAdminRole
          ? [{ value: 'SuperAdmin', label: 'Viloyat Bosh Administratori' }]
          : [])
      ];

  const districtOptions = [
    ...(role === 'SuperAdmin'
      ? [{ value: '', label: '-- Viloyat miqyosida (Barcha tumanlar) --' }]
      : [{ value: '', label: '-- Tumanni tanlang --' }]),
    ...districts.map((d) => ({
      value: d.id,
      label: d.name
    }))
  ];

  const getDialogTitle = (): string => {
    if (editAdmin) {
      return `${fullName || editAdmin.fullName || 'Xodim'} ma‘lumotlarini tahrirlash`;
    }
    switch (role) {
      case 'Manager':
        return 'Yangi Tuman Tozalik Boshlig‘ini Qo‘shish';
      case 'Dispatcher':
        return 'Yangi Tuman Dispetcherini Qo‘shish';
      case 'Inspector':
        return 'Yangi Hudud Nazoratchisini Qo‘shish';
      case 'Driver':
        return 'Yangi Maxsus Texnika Haydovchisini Qo‘shish';
      case 'SuperAdmin':
        return 'Yangi Viloyat Bosh Administratorini Qo‘shish';
      default:
        return 'Yangi Xodim Qo‘shish';
    }
  };

  const getUsernamePlaceholder = (): string => {
    switch (role) {
      case 'Manager':
        return 'boshliq_davlatobod';
      case 'Dispatcher':
        return 'dispetcher_davlatobod';
      case 'Inspector':
        return 'nazoratchi_chortoq';
      case 'Driver':
        return 'haydovchi_50';
      case 'SuperAdmin':
        return 'viloyat_admin';
      default:
        return 'xodim_login';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
      {/* Header with Title and Close Icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
          {getDialogTitle()}
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
        {apiError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.85rem' }}>
            {apiError}
          </Alert>
        )}

        <Box
          component="form"
          id="admin-form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 0.5 }}
        >
          {/* 1. ROLE SELECTION - AT THE VERY TOP */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 700, display: 'block', mb: 0.6 }}>
              Xodim toifasi (Tizimdagi roli)
            </Typography>
            <AppSelectField
              value={role}
              disabled={Boolean(editAdmin && isManagerRole)}
              onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
              options={roleOptions}
            />
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
              {role === 'Manager' && 'Tuman tozalik korxonasi boshlig‘i lavozimiga tayinlash (tuman hisoboti va dispetcherlarni nazorat qiladi)'}
              {role === 'Dispatcher' && 'Murojaatlarni qabul qilish va haydovchilarga topshiriq taqsimlash huquqiga ega bo‘ladi'}
              {role === 'Inspector' && 'Mahallalarda tozalik va chiqindi holatini tekshiruvchi nazoratchi/usta'}
              {role === 'Driver' && 'Chiqindi tashuvchi maxsus avtotransport haydovchisi (Telegram bot orqali ishlaydi)'}
              {role === 'SuperAdmin' && 'Butun viloyat miqyosida barcha tumanlar ustidan to‘liq boshqaruv huquqiga ega administrator'}
            </Typography>
          </Box>

          {/* 2. FULL NAME */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
              F.I.Sh. (To‘liq ism)
            </Typography>
            <TextField
              placeholder="Masalan: Karimov Jasur Bahodirovich"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              size="small"
              error={Boolean(errors.fullName)}
              helperText={errors.fullName}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#FFFFFF',
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' }
                }
              }}
            />
          </Box>

          {/* 3. LOGIN / USERNAME */}
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Foydalanuvchi nomi (Login)
            </Typography>
            <TextField
              placeholder={getUsernamePlaceholder()}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              size="small"
              error={Boolean(errors.username)}
              helperText={errors.username}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#FFFFFF',
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' }
                }
              }}
            />
          </Box>

          {/* 4. PASSWORD */}
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Parol
            </Typography>
            <AppPasswordField
              placeholder={editAdmin ? 'Bo‘sh = o‘zgartirilmaydi' : 'Kamida 6 ta belgi'}
              value={password}
              onChange={(v) => setPassword(v)}
              error={Boolean(errors.password)}
              helperText={errors.password}
            />
          </Box>

          {/* 5. PHONE */}
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Telefon raqami
            </Typography>
            <AppPhoneField
              value={phone}
              onChange={setPhone}
              error={Boolean(errors.phone)}
              helperText={errors.phone}
            />
          </Box>

          {/* 6. JOB TITLE (Lavozimi) */}
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Lavozimi (Rasmiy unvoni)
            </Typography>
            <TextField
              placeholder={getDefaultJobTitle(role)}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#FFFFFF',
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' }
                }
              }}
            />
          </Box>

          {/* 7. DISTRICT SELECTION */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
              {isManagerRole ? 'Biriktirilgan tuman' : 'Tegishli tuman'}
            </Typography>
            {isManagerRole ? (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {currentUser?.district?.name || 'Sizning tumaningiz'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Siz faqat o‘z tumaningizga tegishli dispetcher va xodimlarni boshqara olasiz.
                </Typography>
              </Box>
            ) : role === 'SuperAdmin' ? (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: '#EEF2FF',
                  border: '1px solid #C7D2FE'
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4338CA' }}>
                  Viloyat Boshqaruv Markazi (Barcha tumanlar ustidan to‘liq nazorat)
                </Typography>
                <Typography variant="caption" sx={{ color: '#6366F1' }}>
                  Viloyat Bosh Administratori barcha tumanlar ma’lumotlari va murojaatlarini boshqaradi.
                </Typography>
              </Box>
            ) : (
              <>
                <AppSelectField
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value as number)}
                  options={districtOptions}
                  error={Boolean(errors.districtId)}
                />
                {errors.districtId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.districtId}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, pt: 1, pb: 1.5, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            height: 42,
            borderRadius: '10px',
            color: '#64748B',
            borderColor: '#E2E8F0',
            fontWeight: 600,
            fontSize: '0.88rem',
            textTransform: 'none',
            px: 2.5,
            '&:hover': {
              borderColor: '#CBD5E1',
              bgcolor: '#F8FAFC'
            }
          }}
        >
          Bekor qilish
        </Button>
        <Button
          type="submit"
          form="admin-form"
          variant="contained"
          disabled={isSubmitting}
          sx={{
            flex: 1,
            height: 42,
            borderRadius: '10px',
            bgcolor: 'primary.main',
            fontWeight: 600,
            fontSize: '0.88rem',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: 'none'
            }
          }}
        >
          {isSubmitting ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
