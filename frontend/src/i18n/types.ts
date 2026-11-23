export type Language = 'uz' | 'oz';

export interface CommonTranslations {
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  close: string;
  view: string;
  search: string;
  searchPlaceholder: string;
  refresh: string;
  confirm: string;
  actions: string;
  status: string;
  date: string;
  address: string;
  phone: string;
  fullName: string;
  notes: string;
  home: string;
  active: string;
  inactive: string;
  allDistricts: string;
  allStatuses: string;
  all: string;
  loading: string;
  noData: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  confirmDeleteTitle: string;
  confirmDeleteMsg: string;
  roles: {
    SuperAdmin: string;
    Manager: string;
    Dispatcher: string;
    Inspector: string;
    Driver: string;
    staff: string;
  };
  statuses: {
    new: string;
    in_progress: string;
    submitted: string;
    completed: string;
    rejected: string;
  };
  months: string[];
}

export interface NavTranslations {
  brandTitle: string;
  brandSubtitle: string;
  superAdminTitle: string;
  managerTitle: string;
  dispatcherTitle: string;
  dashboard: string;
  allRequests: string;
  wasteMap: string;
  stats: string;
  districtsAndNeighborhoods: string;
  staffAndManagement: string;
  myAccount: string;
  myTasks: string;
  requests: string;
  district: string;
  region: string;
  managerManagement: string;
  districtRequests: string;
  districtMap: string;
  districtStats: string;
  districtStaff: string;
  myRounds: string;
  routeMap: string;
  areaMap: string;
  requestsList: string;
  driversAndBrigades: string;
  logout: string;
  logoutConfirmTitle: string;
  logoutConfirmDesc: string;
}

export interface ModulesTranslations {
  map: {
    title: string;
    subtitle: string;
    totalPoints: string;
    activeProblems: string;
    cleanedPoints: string;
    mapStyle: string;
    standardOsm: string;
    satellite: string;
    layer: string;
    onlyMarkers: string;
    heatmap: string;
    reset: string;
    operationalModeActive: string;
    viewAllArchive: string;
    last24Hours: string;
    last7Days: string;
    last30Days: string;
    dateRange: string;
    allTime: string;
    selectDistrict: string;
    legendTitle: string;
  };
  requests: {
    title: string;
    subtitle: string;
    requestId: string;
    category: string;
    description: string;
    executor: string;
    householdWaste: string;
    constructionWaste: string;
    foliageWaste: string;
    bulkyWaste: string;
    newRequest: string;
    filterByDistrict: string;
    filterByStatus: string;
  };
  districts: {
    title: string;
    subtitle: string;
    districtsTitle: string;
    neighborhoodsTitle: string;
    addDistrict: string;
    addNeighborhood: string;
    hasPolygon: string;
    noPolygon: string;
    clickToSelect: string;
    neighborhoodName: string;
    belongingDistrict: string;
    deleteDistrictConfirm: string;
  };
  staff: {
    title: string;
    subtitle: string;
    addStaff: string;
    position: string;
    assignedDistrict: string;
    lastActive: string;
    status: string;
  };
  account: {
    title: string;
    subtitle: string;
    totalTasks: string;
    completed: string;
    inProgress: string;
    rejected: string;
    performanceTitle: string;
    recentTasksHistory: string;
    allTasks: string;
  };
  notifications: {
    title: string;
    markAllRead: string;
    clear: string;
    noNotifications: string;
  };
}

export interface Translations {
  common: CommonTranslations;
  nav: NavTranslations;
  modules: ModulesTranslations;
}
