import React from 'react';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { AdminUser } from '../types';

export interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export function buildNavItems(user: AdminUser | null, t: (k: string) => string): NavItemConfig[] {
  const role = user?.role;
  const districtName = user?.district?.name;

  if (role === 'SuperAdmin') {
    return [
      { label: t('nav.dashboard'), path: '/admin', icon: <DashboardOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.allRequests'), path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.wasteMap'), path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.stats'), path: '/admin/stats', icon: <QueryStatsOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.districtsAndNeighborhoods'), path: '/admin/districts', icon: <PlaceOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.staffAndManagement'), path: '/admin/staff', icon: <GroupOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.myAccount'), path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
    ];
  }

  if (role === 'Manager') {
    const d = districtName || t('nav.district');
    return [
      { label: `${d} ${t('nav.managerManagement')}`, path: '/admin', icon: <DashboardOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.districtRequests'), path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.districtMap'), path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.districtStats'), path: '/admin/stats', icon: <QueryStatsOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.districtStaff'), path: '/admin/staff', icon: <GroupOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.myAccount'), path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
    ];
  }

  if (role === 'Inspector') {
    return [
      { label: t('nav.myTasks'), path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.areaMap'), path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.myAccount'), path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
    ];
  }

  if (role === 'Driver') {
    return [
      { label: t('nav.myRounds'), path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.routeMap'), path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: t('nav.myAccount'), path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
    ];
  }

  return [
    { label: t('nav.requestsList'), path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
    { label: t('nav.wasteMap'), path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
    { label: t('nav.driversAndBrigades'), path: '/admin/staff', icon: <GroupOutlinedIcon sx={{ fontSize: 19 }} /> },
    { label: t('nav.myAccount'), path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
  ];
}
