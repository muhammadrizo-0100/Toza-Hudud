export interface CreateDistrictDto {
  name: string;
  code?: string;
  centerLat?: number;
  centerLng?: number;
  polygon?: [number, number][];
  fetchOsmBoundary?: boolean;
}

export interface UpdateDistrictDto {
  name?: string;
  code?: string;
  centerLat?: number;
  centerLng?: number;
  polygon?: [number, number][];
  isActive?: boolean;
}
