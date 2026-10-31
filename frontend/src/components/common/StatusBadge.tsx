import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import { RequestStatus } from '../../types';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: ChipProps['color'];
    Icon: React.ComponentType<{ fontSize?: 'small' | 'inherit' | 'medium' | 'large' }>;
  }
> = {
  new: {
    label: 'Yangi',
    color: 'default',
    Icon: AccessTimeOutlinedIcon
  },
  in_progress: {
    label: 'Jarayonda',
    color: 'warning',
    Icon: AutorenewOutlinedIcon
  },
  submitted: {
    label: 'Tasdiqlashda',
    color: 'info',
    Icon: AssignmentTurnedInOutlinedIcon
  },
  completed: {
    label: 'Tozalandi',
    color: 'success',
    Icon: CheckCircleOutlinedIcon
  },
  rejected: {
    label: 'Rad etildi',
    color: 'error',
    Icon: HighlightOffOutlinedIcon
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'small',
  showIcon = true
}) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'default' as ChipProps['color'],
    Icon: AccessTimeOutlinedIcon
  };

  const IconComponent = config.Icon;

  return (
    <Chip
      size={size}
      variant={config.color === 'default' ? 'outlined' : 'filled'}
      color={config.color}
      label={config.label}
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
