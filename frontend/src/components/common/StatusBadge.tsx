import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import { RequestStatus } from '../../types';
import { useTranslation } from '../../i18n';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

const STATUS_ICONS: Record<
  string,
  {
    color: ChipProps['color'];
    Icon: React.ComponentType<{ fontSize?: 'small' | 'inherit' | 'medium' | 'large' }>;
  }
> = {
  new: {
    color: 'default',
    Icon: AccessTimeOutlinedIcon
  },
  in_progress: {
    color: 'warning',
    Icon: AutorenewOutlinedIcon
  },
  submitted: {
    color: 'info',
    Icon: AssignmentTurnedInOutlinedIcon
  },
  completed: {
    color: 'success',
    Icon: CheckCircleOutlinedIcon
  },
  rejected: {
    color: 'error',
    Icon: HighlightOffOutlinedIcon
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'small',
  showIcon = true
}) => {
  const { getStatusLabel } = useTranslation();
  const config = STATUS_ICONS[status] || {
    color: 'default' as ChipProps['color'],
    Icon: AccessTimeOutlinedIcon
  };

  const IconComponent = config.Icon;
  const label = getStatusLabel(status);

  return (
    <Chip
      size={size}
      variant={config.color === 'default' ? 'outlined' : 'filled'}
      color={config.color}
      label={label}
      icon={showIcon ? <IconComponent fontSize="small" /> : undefined}
      sx={{
        fontWeight: 600,
        fontSize: '0.775rem',
        minWidth: 105,
        justifyContent: 'flex-start',
        px: 0.5
      }}
    />
  );
};
