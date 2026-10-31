import React, { CSSProperties, ReactNode } from 'react';
import { Stack } from '@mui/material';
import DataTableCard from './DataTableCard';

interface FilterBarProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const FilterBar: React.FC<FilterBarProps> = ({ children, className = '', style }) => {
  return (
    <DataTableCard className={className} style={style}>
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ '& > *': { minHeight: 40 } }}
      >
        {children}
      </Stack>
    </DataTableCard>
  );
};

export default FilterBar;
