import React, { ChangeEvent, useRef, useState, useMemo, useEffect } from 'react';
import {
  Alert,
  Box,
  CardMedia,
  IconButton,
  Stack,
  Typography,
  Chip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

interface AppImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  maxFileSizeMb?: number;
  label?: string;
  hint?: string;
  buttonText?: string;
  disabled?: boolean;
}

export default function AppImageUpload({
  value,
  onChange,
  maxFileSizeMb = 10,
  label = 'Chiqindi fotosurati *',
  hint = 'Kameradan rasmga oling yoki fayl tanlang (JPG, PNG, WEBP)',
  buttonText = 'Chiqindi suratini yuklang *',
  disabled = false
}: AppImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const previewUrl = useMemo(() => {
    if (!value) return null;
    return URL.createObjectURL(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxBytes = maxFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg(`Fayl hajmi ${maxFileSizeMb} MB dan oshmasligi kerak.`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Faqat rasm fayllari (JPG, PNG, WEBP) qabul qilinadi.');
      return;
    }

    onChange(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography variant="caption" sx={{ mb: 0.75, display: 'block', fontWeight: 700, color: '#334155' }}>
          {label}
        </Typography>
      )}

      {errorMsg ? (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.5, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled}
      />

      {!value ? (
        <Box
          onClick={() => inputRef.current?.click()}
          sx={{
            py: 2,
            px: 2.5,
            minHeight: 105,
            border: '1.5px dashed',
            borderColor: '#059669',
            borderRadius: 2.5,
            bgcolor: '#F8FAFC',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              borderColor: '#047857',
              bgcolor: 'rgba(5, 150, 105, 0.05)',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)'
            }
          }}
        >
          <Stack spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: 'rgba(5, 150, 105, 0.1)',
                color: '#059669',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <CameraAltOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="body2" fontWeight={700} color="#0F172A">
              {buttonText}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          </Stack>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            border: '1.5px solid #059669',
            borderRadius: 2.5,
            bgcolor: '#F0FDF4'
          }}
        >
          {previewUrl ? (
            <CardMedia
              component="img"
              image={previewUrl}
              alt="Chiqindi surati"
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                objectFit: 'cover',
                border: '1px solid rgba(5, 150, 105, 0.3)'
              }}
            />
          ) : null}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
              <Typography variant="body2" fontWeight={700} color="#0F172A" noWrap>
                {value.name}
              </Typography>
              <Chip
                size="small"
                icon={<CheckCircleOutlinedIcon style={{ fontSize: 14 }} />}
                label="Yuklandi"
                color="success"
                variant="filled"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {(value.size / 1024).toFixed(1)} KB — O‘zgartirish uchun o‘chirib qayta tanlang
            </Typography>
          </Box>
          <IconButton color="error" onClick={handleRemove} size="small" sx={{ bgcolor: '#FFFFFF' }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
