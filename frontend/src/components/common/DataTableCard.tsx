import React, { type CSSProperties, type ReactNode } from 'react';
import { Paper } from '@mui/material';

type DataTableCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  sx?: object;
};

export default function DataTableCard({ children, className = '', style, sx = {} }: DataTableCardProps) {
  return (
    <Paper
      elevation={0}
      className={className}
      sx={{
        overflow: 'hidden',
        p: { xs: 2, md: 2.25 },
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        bgcolor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        ...sx
      }}
      style={style}
    >
      {children}
    </Paper>
  );
}
