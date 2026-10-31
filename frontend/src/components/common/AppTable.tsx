import React, { ReactNode } from 'react';
import { Table, TableContainer, TableProps } from '@mui/material';
import DataTableCard from './DataTableCard';

interface AppTableProps extends TableProps {
  children: ReactNode;
  minWidth?: number | string;
}

export function AppTable({ children, minWidth = 760, sx, ...props }: AppTableProps) {
  return (
    <TableContainer sx={{ overflow: 'auto' }}>
      <Table size="small" {...props} sx={{ minWidth, width: '100%', ...(sx || {}) }}>
        {children}
      </Table>
    </TableContainer>
  );
}

export function AppTableCard({ children, sx }: { children: ReactNode; sx?: object }) {
  return <DataTableCard sx={sx}>{children}</DataTableCard>;
}
