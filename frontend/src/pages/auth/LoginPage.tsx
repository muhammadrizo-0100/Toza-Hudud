import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '../../api/authApi';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { useToast } from '../../context/ToastContext';
import AppPasswordField from '../../components/common/AppPasswordField';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { showSuccess, showError } = useToast();

  const [login, { isLoading }] = useLoginMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      const msg = 'Foydalanuvchi nomini kiriting.';
      setErrorMsg(msg);
      showError(msg);
      return;
    }

    if (!password.trim() || password.length < 6) {
      const msg = 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.';
      setErrorMsg(msg);
      showError(msg);
      return;
    }

    try {
      const data = await login({ username: username.trim(), password: password.trim() }).unwrap();
      dispatch(setCredentials(data));
      const role = data.user?.role;
      const targetPath = role === 'SuperAdmin' || role === 'Manager' ? '/admin' : '/admin/requests';
      showSuccess(`Xush kelibsiz, ${data.user?.fullName || data.user?.username}!`);
      navigate(targetPath);
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string } };
      const msg = errObj?.data?.message || 'Login yoki parol noto‘g‘ri.';
      setErrorMsg(msg);
      showError(msg);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, rgba(5,150,105,0.08) 0%, rgba(5,150,105,0) 32%), linear-gradient(135deg, #F8FAFC 0%, #EEF5FF 100%)'
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 2.5, pb: { xs: 4, md: 8 } }}>
        {/* Top Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Stack spacing={0.5}>
            <Typography variant="overline" color="primary.main">
              Toza Hudud Boshqaruvi
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              Boshqaruv paneliga xavfsiz kirish
            </Typography>
          </Stack>
          <Button
            variant="text"
            onClick={() => navigate('/')}
            startIcon={<ArrowBackOutlinedIcon />}
            sx={{ fontWeight: 600 }}
          >
            Fuqarolar portali
          </Button>
        </Stack>

        {/* Two-Column Grid */}
        <Box
          sx={{
            minHeight: { xs: 'auto', md: '72vh' },
            display: 'grid',
            alignItems: 'center',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
            gap: 4
          }}
        >
          {/* Left Hero Box */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, pr: 4 }}>
            <Typography variant="h2" sx={{ mb: 2, fontWeight: 800, color: '#0F172A' }}>
              Chiqindi murojaatlari, tumanlar va xodimlar nazorati bir joyda.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mb: 3, lineHeight: 1.6 }}>
              Yagona axborot tizimi orqali sanitar tozalash brigadalari, tuman va mahallalardagi
              ahlat yig‘ilish muammolari hamda fuqarolar murojaatlarini tezkor nazorat qiling.
            </Typography>
            <Box
              sx={{
                p: 3,
                borderRadius: 3.5,
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid',
                borderColor: 'rgba(145, 158, 171, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.75 }}>
                Tezkor kirish
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                Bosh administrator barcha tumanlar statistikasini kuzatadi. Tuman dispetcherlari
                esa faqat o‘z hududiga biriktirilgan arizalarni qayta ishlaydi.
              </Typography>
            </Box>
          </Box>

          {/* Right Login Card */}
          <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
            <Card
              variant="outlined"
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                boxShadow: '0 0 2px rgba(145,158,171,0.2), 0 20px 40px -8px rgba(145,158,171,0.16)'
              }}
            >
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 2.5,
                    bgcolor: 'rgba(5, 150, 105, 0.1)',
                    color: 'primary.main'
                  }}
                >
                  <SecurityOutlinedIcon fontSize="medium" />
                </Box>
                <Typography variant="h4" fontWeight={800}>
                  Xodimlar Tizimi
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tizimga kirish uchun foydalanuvchi nomi va parolingizni kiriting.
                </Typography>
              </Stack>

              {errorMsg ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMsg}
                </Alert>
              ) : null}

              <Box component="form" noValidate onSubmit={handleLogin}>
                <Stack spacing={2.25}>
                  <TextField
                    label="Foydalanuvchi nomi"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    fullWidth
                    autoFocus
                  />
                  <AppPasswordField
                    label="Parol"
                    value={password}
                    onChange={setPassword}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Boshqaruv xodimlari uchun yopiq axborot tizimi.
                  </Typography>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    fullWidth
                    sx={{
                      py: 1.4,
                      fontWeight: 700,
                      borderRadius: 2.5
                    }}
                  >
                    {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Kirish'}
                  </Button>
                </Stack>
              </Box>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
