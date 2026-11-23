import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Divider,
  Dialog,
  TextField,
  CircularProgress,
  DialogContent,
  IconButton,
  Chip
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';

import {
  useGetRequestByIdQuery,
  useAssignWorkerMutation,
  useSubmitWorkMutation,
  useVerifyWorkMutation,
  useRejectWorkMutation
} from '../../api/requestsApi';
import { useGetWorkersQuery } from '../../api/workersApi';
import { useAppSelector } from '../../store/hooks';
import { isFieldExecutor } from '../../utils/roles';
import { useToast } from '../../context/ToastContext';
import DataTableCard from '../../components/common/DataTableCard';
import AppButton from '../../components/common/AppButton';
import AppSelectField from '../../components/common/AppSelectField';
import AppImageUpload from '../../components/common/AppImageUpload';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RequestItem } from '../../types';
import { useTranslation } from '../../i18n';
import { translateDistrictName, translateMahallaName } from '../../utils/districtNames';

function getWasteTypeLabel(type?: string | null, lang: 'uz' | 'oz' = 'uz'): string {
  switch (type) {
    case 'qurilish':
      return lang === 'oz' ? 'Қурилиш чиқиндилари' : 'Qurilish chiqindilari';
    case 'xazon':
      return lang === 'oz' ? 'Хазон ва шохлар' : 'Xazon va shoxlar';
    case 'katta_hajmli':
      return lang === 'oz' ? 'Йирик габаритли чиқиндилар' : 'Katta hajmli chiqindilar';
    case 'noqonuniy':
      return lang === 'oz' ? 'Ноқонуний ташландиқ' : 'Noqonuniy tashlandiq';
    case 'maishiy':
    default:
      return lang === 'oz' ? 'Маиший чиқиндилар' : 'Maishiy chiqindilar';
  }
}

interface RequestDetailPageProps {
  requestId: number;
  onBack: () => void;
  onUpdated?: () => void;
}

function DetailItem({ label, value, accent = false }: { label: string; value?: string | number | null; accent?: boolean }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem' }}>
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          mt: 0.5,
          fontWeight: 700,
          fontSize: '1rem',
          color: accent ? 'primary.main' : 'text.primary'
        }}
      >
        {value || '-'}
      </Typography>
    </Box>
  );
}

export const RequestDetailPage: React.FC<RequestDetailPageProps> = ({
  requestId,
  onBack,
  onUpdated
}) => {
  const { t, lang } = useTranslation();
  const { data: request, isLoading, refetch } = useGetRequestByIdQuery(requestId, {
    refetchOnMountOrArgChange: true
  });

  const districtId = request?.districtId;
  const { data: workers = [] } = useGetWorkersQuery(districtId ? { districtId } : undefined);

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [beforeImgError, setBeforeImgError] = useState(false);
  const [afterImgError, setAfterImgError] = useState(false);

  React.useEffect(() => {
    setAfterImgError(false);
    setBeforeImgError(false);
  }, [request?.id, request?.afterPhotoUrl, request?.beforePhotoUrl]);

  const { user } = useAppSelector((state) => state.auth);
  const isField = isFieldExecutor(user?.role);
  const { showSuccess, showError, showWarning } = useToast();

  const [assignWorker, { isLoading: isAssigning }] = useAssignWorkerMutation();
  const [submitWork, { isLoading: isSubmitting }] = useSubmitWorkMutation();
  const [verifyWork, { isLoading: isVerifying }] = useVerifyWorkMutation();
  const [rejectWork, { isLoading: isRejecting }] = useRejectWorkMutation();

  const handleAssign = async () => {
    if (!selectedWorkerId || !request) return;
    try {
      await assignWorker({ id: request.id, workerId: Number(selectedWorkerId) }).unwrap();
      showSuccess(
        request.status === 'rejected'
          ? (lang === 'oz'
              ? `Мурожаат янги ходимга муваффақиятли қайта бириктирилди (#${request.id})`
              : `Murojaat yangi xodimga muvaffaqiyatli qayta biriktirildi (#${request.id})`)
          : request.status === 'in_progress'
          ? (lang === 'oz'
              ? `Масъул ходим муваффақиятли алмаштирилди (#${request.id})`
              : `Mas'ul xodim muvaffaqiyatli almashtirildi (#${request.id})`)
          : (lang === 'oz'
              ? `Топшириқ ходимга муваффақиятли бириктирилди (#${request.id})`
              : `Topshiriq xodimga muvaffaqiyatli biriktirildi (#${request.id})`)
      );
      setSelectedWorkerId('');
      refetch();
      onUpdated?.();
    } catch (err: any) {
      console.error('Assign error:', err);
      showError(err?.data?.message || (lang === 'oz' ? 'Бириктиришда хатолик юз берди' : 'Biriktirishda xatolik yuz berdi'));
    }
  };

  const handleVerify = async () => {
    if (!request) return;
    try {
      await verifyWork(request.id).unwrap();
      showSuccess(
        lang === 'oz'
          ? `Мурожаат #${request.id} тасдиқланди ва муваффақиятли якунланди!`
          : `Murojaat #${request.id} tasdiqlandi va muvaffaqiyatli yakunlandi!`
      );
      refetch();
      onUpdated?.();
    } catch (err: any) {
      console.error('Verify error:', err);
      showError(err?.data?.message || (lang === 'oz' ? 'Тасдиқлашда хатолик юз берди' : 'Tasdiqlashda xatolik yuz berdi'));
    }
  };

  const handleComplete = async () => {
    if (!request) return;
    try {
      if (proofFile) {
        await submitWork({ id: request.id, file: proofFile }).unwrap();
      } else {
        await submitWork({ id: request.id, afterPhotoUrl: request.beforePhotoUrl }).unwrap();
      }
      showSuccess(
        lang === 'oz'
          ? 'Тозалаш фотоҳисоботи юкланди ва тасдиқлаш учун юборилди!'
          : 'Tozalash fotohisoboti yuklandi va tasdiqlash uchun yuborildi!'
      );
      setCompleteModalOpen(false);
      refetch();
      onUpdated?.();
    } catch (err: any) {
      console.error('Complete error:', err);
      showError(err?.data?.message || (lang === 'oz' ? 'Ҳисоботни юборишда хатолик юз берди' : 'Hisobotni yuborishda xatolik yuz berdi'));
    }
  };

  const handleReject = async () => {
    if (!request) return;
    const cleanReason = rejectReason.trim();
    if (!cleanReason || cleanReason.length < 5) {
      showError(
        lang === 'oz'
          ? 'Илтимос, рад этиш сабабини аниқроқ ёзинг (камида 5 та белги)'
          : 'Iltimos, rad etish sababini aniqroq yozing (kamida 5 ta belgi)'
      );
      return;
    }
    try {
      await rejectWork({ id: request.id, reason: cleanReason }).unwrap();
      showWarning(lang === 'oz' ? `Мурожаат #${request.id} рад этилди` : `Murojaat #${request.id} rad etildi`);
      setRejectModalOpen(false);
      setRejectReason('');
      refetch();
      onUpdated?.();
    } catch (err: any) {
      console.error('Reject error:', err);
      showError(err?.data?.message || (lang === 'oz' ? 'Рад этишда хатолик юз берди' : 'Rad etishda xatolik yuz berdi'));
    }
  };

  if (isLoading || !request) {
    return (
      <Box sx={{ py: 12, textAlign: 'center' }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  const isCompleted = request.status === 'completed';
  const isNew = request.status === 'new';
  const isInProgress = request.status === 'in_progress';
  const isSubmitted = request.status === 'submitted';
  const isRejected = request.status === 'rejected';

  return (
    <Stack spacing={2.5}>
      {/* Breadcrumbs for deep navigation */}
      <AppBreadcrumbs
        items={[
          { label: t('nav.requests'), path: '/admin/requests' },
          { label: `${lang === 'oz' ? 'Мурожаат' : 'Murojaat'} #${request.id}` }
        ]}
      />

      {/* Top Navigation Bar with Back Button (BSK Style) */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <AppButton
          variant="secondary"
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={onBack}
          sx={{ borderRadius: 2.5, px: 2, height: 40 }}
        >
          {lang === 'oz' ? 'Орқага' : 'Orqaga'}
        </AppButton>
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          {lang === 'oz' ? 'Мурожаат тафсилоти' : 'Murojaat tafsiloti'} #{request.id}
        </Typography>
      </Stack>

      {/* Two-Column BSK Layout */}
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' },
          alignItems: 'start'
        }}
      >
        {/* Left Column: 5 Structured Detail Cards */}
        <Stack spacing={2.5}>
          {/* Prominent Rejection Banner */}
          {isRejected && (
            <Box
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2.5,
                bgcolor: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.08)'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    bgcolor: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <HighlightOffOutlinedIcon sx={{ color: '#DC2626', fontSize: 28 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#991B1B' }}>
                      {lang === 'oz' ? 'Мурожаат ходим томонидан рад этилган!' : 'Murojaat xodim tomonidan rad etilgan!'}
                    </Typography>
                    <Chip
                      size="small"
                      label={lang === 'oz' ? 'Қайта бириктириш талаб этилади' : 'Qayta biriktirish talab etiladi'}
                      sx={{
                        bgcolor: '#FEE2E2',
                        color: '#B91C1C',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        border: '1px solid #FECACA'
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#7F1D1D', mb: 2, fontSize: '0.88rem' }}>
                    {lang === 'oz'
                      ? 'Ушбу топшириқ ижрочиси томонидан рад этилган ва ҳозирда ижрочисиз ҳолатда турибди. Ҳудуддаги чиқиндини бартараф этиш учун ўнг тарафдаги бошқарув блокидан бошқа масъул ходим ёки мос техникани танлаб топшириқни қайта бириктиринг.'
                      : 'Ushbu topshiriq ijrochisi tomonidan rad etilgan va hozirda ijrochisiz holatda turibdi. Hududdagi chiqindini bartaraf etish uchun o‘ng tarafdagi boshqaruv blokidan boshqa mas\'ul xodim yoki mos texnikani tanlab topshiriqni qayta biriktiring.'}
                  </Typography>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid #FECACA',
                      borderLeft: '4px solid #DC2626'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748B',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        mb: 0.5
                      }}
                    >
                      {lang === 'oz' ? 'Рад этиш сабаби:' : 'Rad etish sababi:'}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#991B1B',
                        fontWeight: 600,
                        fontSize: '0.98rem',
                        fontStyle: 'italic',
                        wordBreak: 'break-word'
                      }}
                    >
                      "{request.rejectionReason || (lang === 'oz' ? 'Сабаб кўрсатилмаган' : 'Sabab ko‘rsatilmagan')}"
                    </Typography>
                    {request.assignedWorker && (
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1.25 }}>
                        {lang === 'oz' ? 'Рад этган собиқ ижрочи:' : 'Rad etgan sobiq ijrochi:'} <strong>{request.assignedWorker.fullName}</strong> ({request.assignedWorker.role === 'Inspector' ? (lang === 'oz' ? 'Ҳудуд назоратчиси' : 'Hudud nazoratchisi') : (lang === 'oz' ? 'Махсус техника ҳайдовчиси' : 'Maxsus texnika haydovchisi')}{request.assignedWorker.vehicleNumber ? `, ${lang === 'oz' ? 'давлат рақами' : 'davlat raqami'}: ${request.assignedWorker.vehicleNumber}` : ''})
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Stack>
            </Box>
          )}

          {/* 1. Asosiy ma'lumotlar Card */}
          <DataTableCard>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 2.5 }}>
              {lang === 'oz' ? 'Асосий маълумотлар' : 'Asosiy ma‘lumotlar'}
            </Typography>

            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <DetailItem
                label={lang === 'oz' ? 'Фуқаро' : 'Fuqaro'}
                value={request.citizenFullName || (lang === 'oz' ? 'Номаълум' : 'Noma‘lum')}
              />
              <DetailItem
                label={lang === 'oz' ? 'Телефон' : 'Telefon'}
                value={request.citizenPhone || '-'}
              />
              <DetailItem
                label={lang === 'oz' ? 'Категория' : 'Kategoriya'}
                value={getWasteTypeLabel(request.wasteType, lang)}
                accent
              />

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem' }}>
                  {lang === 'oz' ? 'Жорий ҳолат' : 'Joriy holat'}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <StatusBadge status={request.status} />
                </Box>
              </Box>

              <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem' }}>
                  {lang === 'oz' ? 'Ҳудуд ва Манзил' : 'Hudud va Manzil'}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5 }}>
                  {translateMahallaName(request.mahalla?.name || request.mahallaName, lang) || (lang === 'oz' ? 'Ҳудуд кўрсатилмаган' : 'Hudud ko‘rsatilmagan')}
                </Typography>
                <Box
                  sx={{
                    mt: 1.5,
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <Typography variant="body2" fontWeight={600} color="#1E293B">
                    {request.address || (lang === 'oz' ? 'Аниқ манзил киритилмаган' : 'Aniq manzil kiritilmagan')}
                  </Typography>
                  {request.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {lang === 'oz' ? 'Қўшимча изоҳ:' : 'Qo‘shimcha izoh:'} {request.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {request.lat && request.lng && (
              <AppButton
                variant="secondary"
                startIcon={<FmdGoodOutlinedIcon fontSize="small" />}
                sx={{ mt: 2.5 }}
                onClick={() =>
                  window.open(
                    `https://yandex.com/maps/?ll=${request.lng},${request.lat}&z=17&pt=${request.lng},${request.lat}`,
                    '_blank'
                  )
                }
              >
                {lang === 'oz' ? 'Харитада очиш' : 'Xaritada ochish'}
              </AppButton>
            )}
          </DataTableCard>

          {/* 2. Mas'ul Tashkilot (Sanitar Bo'lim) Card */}
          <DataTableCard>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <BusinessOutlinedIcon color="primary" />
              <Typography variant="h5" fontWeight={800}>
                {lang === 'oz' ? 'Масъул Ташкилот (Санитар Бўлим)' : 'Mas‘ul Tashkilot (Sanitar Bo‘lim)'}
              </Typography>
            </Stack>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <DetailItem
                label={lang === 'oz' ? 'Ташкилот номи' : 'Tashkilot nomi'}
                value={
                  lang === 'oz'
                    ? `${translateDistrictName(request.district?.name, 'oz') || 'Давлатобод тумани'} Тоза Ҳудуд ДУК`
                    : `${request.district?.name || 'Davlatobod tumani'} Toza Hudud DUK`
                }
              />
              <DetailItem label={lang === 'oz' ? 'Алоқа рақами' : 'Aloqa raqami'} value="+998 69 227-00-00" accent />
            </Box>
          </DataTableCard>

          {/* 3. Mas'ul Xodim (Brigada) Card */}
          {request.assignedWorker && (
            <DataTableCard>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <AssignmentIndOutlinedIcon color="success" />
                <Typography variant="h5" fontWeight={800}>
                  {lang === 'oz' ? 'Масъул Ходим (Бригада)' : 'Mas‘ul Xodim (Brigada)'}
                </Typography>
              </Stack>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
                <DetailItem label={lang === 'oz' ? 'Ф.И.Ш' : 'F.I.Sh'} value={request.assignedWorker.fullName} />
                <DetailItem
                  label={lang === 'oz' ? 'Лавозим' : 'Lavozim'}
                  value={
                    request.assignedWorker.role === 'Inspector'
                      ? (lang === 'oz' ? 'Ҳудуд назоратчиси / Уста' : 'Hudud nazoratchisi / Usta')
                      : (lang === 'oz' ? 'Махсус техника ҳайдовчиси' : 'Maxsus texnika haydovchisi')
                  }
                />
                <DetailItem label={lang === 'oz' ? 'Алоқа рақами' : 'Aloqa raqami'} value={request.assignedWorker.phone} accent />
                {request.assignedWorker.vehicleNumber && (
                  <DetailItem label={lang === 'oz' ? 'Автотранспорт' : 'Avtotransport'} value={request.assignedWorker.vehicleNumber} />
                )}
              </Box>
            </DataTableCard>
          )}

          {/* 4. Dastlabki biriktirilgan fayllar (Before photo) */}
          {request.beforePhotoUrl && (
            <DataTableCard>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
                {lang === 'oz' ? 'Дастлабки бириктирилган файллар' : 'Dastlabki biriktirilgan fayllar'}
              </Typography>
              <Box sx={{ maxWidth: 380 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  {lang === 'oz' ? '1-расм (Фуқаро)' : 'Rasm 1 (Fuqaro)'}
                </Typography>
                {beforeImgError ? (
                  <Box
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#F8FAFC',
                      borderRadius: 2.5,
                      border: '1.5px dashed #CBD5E1'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {lang === 'oz' ? 'Фотосурат очилмади ёки юкланмаган' : 'Fotosurat ochilmadi yoki yuklanmagan'}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    component="img"
                    src={request.beforePhotoUrl}
                    alt={lang === 'oz' ? 'Фуқаро юборган расм' : 'Fuqaro yuborgan rasm'}
                    onError={() => setBeforeImgError(true)}
                    onClick={() => setZoomImage(request.beforePhotoUrl)}
                    sx={{
                      width: '100%',
                      height: 240,
                      objectFit: 'cover',
                      borderRadius: 2.5,
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.02)' }
                    }}
                  />
                )}
              </Box>
            </DataTableCard>
          )}

          {/* 5. Xodim yuborgan isbot fayli (After photo) */}
          {request.afterPhotoUrl && (
            <DataTableCard>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
                {lang === 'oz' ? 'Ходим юборган исбот файли' : 'Xodim yuborgan isbot fayli'}
              </Typography>
              <Box sx={{ maxWidth: 380 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  {lang === 'oz' ? 'Исбот расми (Тозаланганидан сўнг)' : 'Isbot rasmi (Tozalanganidan so‘ng)'}
                </Typography>
                {afterImgError ? (
                  <Box
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#F8FAFC',
                      borderRadius: 2.5,
                      border: '1.5px dashed #CBD5E1'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Fotosurat ochilmadi yoki yuklanmagan
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    component="img"
                    src={request.afterPhotoUrl}
                    alt="Xodim isbot rasmi"
                    onError={() => setAfterImgError(true)}
                    onClick={() => setZoomImage(request.afterPhotoUrl || null)}
                    sx={{
                      width: '100%',
                      height: 240,
                      objectFit: 'cover',
                      borderRadius: 2.5,
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.02)' }
                    }}
                  />
                )}
              </Box>
            </DataTableCard>
          )}
        </Stack>

        {/* Right Column: Boshqaruv Card (BSK Style) */}
        <DataTableCard sx={{ p: 2.5, position: 'sticky', top: 100 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            {lang === 'oz' ? 'Бошқарув' : 'Boshqaruv'}
          </Typography>

          {isCompleted ? (
            <Box sx={{ p: 2, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CheckCircleOutlinedIcon sx={{ color: '#059669', fontSize: 24 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#065F46', fontWeight: 700 }}>
                    {lang === 'oz' ? 'Мурожаат тўлиқ якунланган' : 'Murojaat to‘liq yakunlangan'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block', mt: 0.25 }}>
                    {lang === 'oz' ? 'Тозалаш ишлари муваффақиятли қабул қилинган ва архивланган.' : 'Tozalash ishlari muvaffaqiyatli qabul qilingan va arxivlangan.'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ) : isField ? (
            /* Field Executor View (Inspector & Driver) */
            <Stack spacing={2.5}>
              {isRejected ? (
                <Box sx={{ p: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <HighlightOffOutlinedIcon sx={{ color: '#DC2626', fontSize: 24, mt: 0.2 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#991B1B', fontWeight: 700 }}>
                        {lang === 'oz' ? 'Вазифа рад этилган' : 'Vazifa rad etilgan'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#B91C1C', display: 'block', mt: 0.5 }}>
                        {lang === 'oz' ? 'Кўрсатилган сабаб:' : 'Ko‘rsatilgan sabab:'} "{request.rejectionReason || (lang === 'oz' ? 'Сабаб кўрсатилмаган' : 'Sabab ko‘rsatilmagan')}"
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#7F1D1D', display: 'block', mt: 1 }}>
                        {lang === 'oz' ? 'Диспетчер ёки туман раҳбари томонидан бошқа ходимга қайта бириктирилиши кутилмоқда.' : 'Dispetcher yoki tuman rahbari tomonidan boshqa xodimga qayta biriktirilishi kutilmoqda.'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ) : !isSubmitted ? (
                <Stack spacing={2}>
                  <Box sx={{ p: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <TaskAltOutlinedIcon sx={{ color: '#166534', fontSize: 24 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#166534', fontWeight: 700 }}>
                          {lang === 'oz' ? 'Топшириқ сизга бириктирилган' : 'Topshiriq sizga biriktirilgan'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#15803D', display: 'block', mt: 0.25 }}>
                          {lang === 'oz' ? 'Ҳудудга боринг, тозалашни амалга ошириб фотосуратли ҳисобот юкланг.' : 'Hududga boring, tozalashni amalga oshirib fotosuratli hisobot yuklang.'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <AppButton
                    variant="primary"
                    fullWidth
                    startIcon={<CameraAltOutlinedIcon />}
                    onClick={() => setCompleteModalOpen(true)}
                    sx={{ py: 1.4, fontSize: '0.95rem', fontWeight: 700, borderRadius: 2 }}
                  >
                    {lang === 'oz' ? 'Ҳисобот юклаш (Бажарилди)' : 'Hisobot yuklash (Bajarildi)'}
                  </AppButton>

                  <AppButton
                    variant="danger"
                    fullWidth
                    startIcon={<HighlightOffOutlinedIcon />}
                    onClick={() => setRejectModalOpen(true)}
                    sx={{ py: 1 }}
                  >
                    {lang === 'oz' ? 'Муаммо ҳақида билдириш / Рад этиш' : 'Muammo haqida bildirish / Rad etish'}
                  </AppButton>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Box sx={{ p: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <HourglassTopOutlinedIcon sx={{ color: '#2563EB', fontSize: 24, mt: 0.2 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#1E40AF', fontWeight: 700 }}>
                          {lang === 'oz' ? 'Ҳисобот текширувда' : 'Hisobot tekshiruvda'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1D4ED8', display: 'block', mt: 0.5 }}>
                          {lang === 'oz' ? 'Сиз юклаган фотосурат диспетчер ёки бўлим бошлиғи томонидан тасдиқланиши кутилмоқда.' : 'Siz yuklagan fotosurat dispetcher yoki bo‘lim boshlig‘i tomonidan tasdiqlanishi kutilmoqda.'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <AppButton
                    variant="secondary"
                    fullWidth
                    startIcon={<CameraAltOutlinedIcon />}
                    onClick={() => setCompleteModalOpen(true)}
                    sx={{ py: 1.1, fontSize: '0.88rem' }}
                  >
                    {lang === 'oz' ? 'Ҳисобот расмини алмаштириш' : 'Hisobot rasmini almashtirish'}
                  </AppButton>
                </Stack>
              )}
            </Stack>
          ) : (
            /* Dispatcher, Manager & SuperAdmin View */
            <Stack spacing={2.5}>
              {isRejected && (
                <Box sx={{ p: 2, bgcolor: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 2.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <HighlightOffOutlinedIcon sx={{ color: '#DC2626', fontSize: 24, mt: 0.2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#991B1B', fontWeight: 800 }}>
                        {lang === 'oz' ? 'Мурожаат рад этилган' : 'Murojaat rad etilgan'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#B91C1C', display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                        <strong>{lang === 'oz' ? 'Сабаб:' : 'Sabab:'}</strong> "{request.rejectionReason || (lang === 'oz' ? 'Ходим томонидан рад этилган.' : 'Xodim tomonidan rad etilgan.')}"
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#7F1D1D', display: 'block', mt: 1, fontWeight: 600 }}>
                        {lang === 'oz' ? 'Пастдаги рўйхатдан бошқа масъул ходимни танлаб, мурожаатни қайта бириктиринг:' : 'Pastdagi ro‘yxatdan boshqa mas\'ul xodimni tanlab, murojaatni qayta biriktiring:'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Worker selector */}
              {(isNew || isInProgress || isRejected) && (
                <Box>
                  <AppSelectField
                    label={
                      isRejected
                        ? (lang === 'oz' ? 'Қайта бириктириш учун янги ходим' : 'Qayta biriktirish uchun yangi xodim')
                        : (lang === 'oz' ? 'Масъул ходим' : 'Mas‘ul xodim')
                    }
                    value={
                      selectedWorkerId !== ''
                        ? selectedWorkerId
                        : isRejected
                        ? ''
                        : request.assignedWorkerId
                        ? String(request.assignedWorkerId)
                        : ''
                    }
                    onChange={(e) => setSelectedWorkerId(String(e.target.value))}
                    options={[
                      {
                        value: '',
                        label: isRejected
                          ? (lang === 'oz' ? '-- Қайта бириктириш учун ходимни танланг --' : '-- Qayta biriktirish uchun xodimni tanlang --')
                          : (lang === 'oz' ? '-- Масъул ходимни танланг --' : '-- Mas’ul xodimni tanlang --')
                      },
                      ...workers.map((w) => {
                        const isInsp = w.role === 'Inspector';
                        const roleTag = isInsp
                          ? (lang === 'oz' ? 'Ҳудуд назоратчиси' : 'Hudud nazoratchisi')
                          : (lang === 'oz' ? 'Ҳайдовчи' : 'Haydovchi');
                        const extra = isInsp ? '' : w.vehicleNumber ? ` [${w.vehicleNumber}]` : '';
                        return {
                          value: String(w.id),
                          label: `${w.fullName} — ${roleTag}${extra}`
                        };
                      })
                    ]}
                  />
                </Box>
              )}

              {/* Action Buttons */}
              {isNew && (
                <AppButton
                  variant="primary"
                  fullWidth
                  loading={isAssigning}
                  disabled={!selectedWorkerId}
                  onClick={handleAssign}
                  sx={{ py: 1.25 }}
                >
                  {lang === 'oz' ? 'Ходим бириктириш ва жараёнга олиш' : 'Xodim biriktirish va jarayonga olish'}
                </AppButton>
              )}

              {isRejected && (
                <AppButton
                  variant="primary"
                  fullWidth
                  loading={isAssigning}
                  disabled={!selectedWorkerId}
                  startIcon={<SwapHorizOutlinedIcon />}
                  onClick={handleAssign}
                  sx={{
                    py: 1.35,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    bgcolor: '#059669',
                    '&:hover': { bgcolor: '#047857' }
                  }}
                >
                  {lang === 'oz' ? 'Бошқа ходимга қайта бириктириш' : 'Boshqa xodimga qayta biriktirish'}
                </AppButton>
              )}

              {isInProgress && (
                <Stack spacing={1.5}>
                  <Box sx={{ p: 2, bgcolor: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <HourglassTopOutlinedIcon sx={{ color: '#16A34A', fontSize: 24, mt: 0.2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#15803D', fontWeight: 800 }}>
                          {lang === 'oz' ? 'Тозалаш жараёни давом этмоқда' : 'Tozalash jarayoni davom etmoqda'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#166534', display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                          {lang === 'oz'
                            ? <>Масъул ходим (<b>{request.assignedWorker?.fullName || 'Ходим'}</b>) тозалашни якунлаб, фотосуратли ҳисобот юклагач, қабул қилиш тугмаси фаоллашади.</>
                            : <>Mas’ul xodim (<b>{request.assignedWorker?.fullName || 'Xodim'}</b>) tozalashni yakunlab, fotosuratli hisobot yuklagach, qabul qilish tugmasi faollashadi.</>}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {selectedWorkerId && selectedWorkerId !== String(request.assignedWorkerId) && (
                    <AppButton
                      variant="primary"
                      fullWidth
                      loading={isAssigning}
                      onClick={handleAssign}
                      sx={{ py: 1.25 }}
                    >
                      {lang === 'oz' ? 'Бошқа ходимга қайта бириктириш' : 'Boshqa xodimga qayta biriktirish'}
                    </AppButton>
                  )}

                  <AppButton
                    variant="danger"
                    fullWidth
                    startIcon={<HighlightOffOutlinedIcon />}
                    onClick={() => setRejectModalOpen(true)}
                  >
                    {lang === 'oz' ? 'Рад этиш' : 'Rad etish'}
                  </AppButton>
                </Stack>
              )}

              {isSubmitted && (
                <Stack spacing={2}>
                  <Box sx={{ p: 1.75, bgcolor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#92400E', fontWeight: 700 }}>
                      {lang === 'oz' ? 'Ходим ҳисобот юклаган' : 'Xodim hisobot yuklagan'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#78350F', display: 'block', mt: 0.5 }}>
                      {lang === 'oz' ? 'Юкланган исбот фотосуратини текширинг ва ишни қабул қилинг.' : 'Yuklangan isbot fotosuratini tekshiring va ishni qabul qiling.'}
                    </Typography>
                  </Box>

                  <AppButton
                    variant="primary"
                    fullWidth
                    loading={isVerifying}
                    startIcon={<TaskAltOutlinedIcon />}
                    onClick={handleVerify}
                    sx={{ py: 1.35, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, fontWeight: 700 }}
                  >
                    {lang === 'oz' ? 'Ишни тасдиқлаш ва қабул қилиш' : 'Ishni tasdiqlash va qabul qilish'}
                  </AppButton>

                  <AppButton
                    variant="danger"
                    fullWidth
                    startIcon={<HighlightOffOutlinedIcon />}
                    onClick={() => setRejectModalOpen(true)}
                  >
                    {lang === 'oz' ? 'Рад этиш / Қайтариш' : 'Rad etish / Qaytarish'}
                  </AppButton>
                </Stack>
              )}
            </Stack>
          )}
        </DataTableCard>
      </Box>

      {/* Complete Work Modal */}
      <Dialog open={completeModalOpen} onClose={() => setCompleteModalOpen(false)} maxWidth="xs" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>
            {lang === 'oz' ? 'Тозалашни якунлаш' : 'Tozalashni yakunlash'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {lang === 'oz' ? 'Чиқинди тозаланганлигини тасдиқловчи якуний фотосуратни юкланг:' : 'Chiqindi tozalanganligini tasdiqlovchi yakuniy fotosuratni yuklang:'}
          </Typography>
          <AppImageUpload value={proofFile} onChange={setProofFile} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            <AppButton variant="secondary" onClick={() => setCompleteModalOpen(false)}>
              {t('common.cancel')}
            </AppButton>
            <AppButton variant="primary" loading={isSubmitting} disabled={!proofFile} onClick={handleComplete}>
              {lang === 'oz' ? 'Тасдиқлаш' : 'Tasdiqlash'}
            </AppButton>
          </Stack>
        </Box>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626'
              }}
            >
              <HighlightOffOutlinedIcon />
            </Box>
            <Typography variant="h5" fontWeight={800}>
              {lang === 'oz' ? 'Топшириқни рад этиш' : 'Topshiriqni rad etish'}
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {lang === 'oz'
              ? 'Рад этиш сабабини аниқ ва тўлиқ баён қилинг. Ушбу сабаб туман раҳбари, диспетчер ва фуқарога кўрсатилади ҳамда топшириқни қайта бириктириш учун асос бўлади:'
              : 'Rad etish sababini aniq va to‘liq bayon qiling. Ushbu sabab tuman rahbari, dispetcher va fuqaroga ko‘rsatiladi hamda topshiriqni qayta biriktirish uchun asos bo‘ladi:'}
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            required
            label={lang === 'oz' ? 'Рад этиш сабаби (мажбурий) *' : 'Rad etish sababi (majburiy) *'}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={
              lang === 'oz'
                ? 'Масалан: Ушбу жойда чиқинди жуда кўп тўпланган, оддий фургон эмас, балки катта ҳажмли самосвал ёки юклагич техника керак...'
                : 'Masalan: Ushbu joyda chiqindi juda ko‘p to‘plangan, oddiy furgon emas, balki katta hajmli samosval yoki yuklagich texnika kerak...'
            }
            error={rejectReason.length > 0 && rejectReason.trim().length < 5}
            helperText={
              rejectReason.length > 0 && rejectReason.trim().length < 5
                ? (lang === 'oz' ? 'Сабаб камида 5 та белгидан иборат бўлиши лозим' : 'Sabab kamida 5 ta belgidan iborat bo‘lishi lozim')
                : (lang === 'oz' ? 'Рад этиш сабабини киритиш мажбурий (камида 5 та белги)' : 'Rad etish sababini kiritish majburiy (kamida 5 ta belgi)')
            }
          />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            <AppButton variant="secondary" onClick={() => setRejectModalOpen(false)}>
              {t('common.cancel')}
            </AppButton>
            <AppButton
              variant="danger"
              loading={isRejecting}
              disabled={!rejectReason.trim() || rejectReason.trim().length < 5}
              onClick={handleReject}
              sx={{ px: 3, fontWeight: 700 }}
            >
              {lang === 'oz' ? 'Рад этишни тасдиқлаш' : 'Rad etishni tasdiqlash'}
            </AppButton>
          </Stack>
        </Box>
      </Dialog>

      {/* Image Lightbox Dialog */}
      <Dialog open={Boolean(zoomImage)} onClose={() => setZoomImage(null)} maxWidth="md">
        <DialogContent sx={{ p: 1, position: 'relative', bgcolor: '#000000' }}>
          <IconButton
            onClick={() => setZoomImage(null)}
            sx={{ position: 'absolute', top: 12, right: 12, color: '#FFFFFF', bgcolor: 'rgba(0,0,0,0.5)' }}
          >
            <CloseIcon />
          </IconButton>
          {zoomImage && (
            <Box
              component="img"
              src={zoomImage}
              alt={lang === 'oz' ? 'Катталаштирилган расм' : 'Kattalashtirilgan rasm'}
              sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default RequestDetailPage;
