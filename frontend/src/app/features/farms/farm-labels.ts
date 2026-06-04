import { FarmStatus, IrrigationType, LandSizeUnit, OwnershipType, SoilType } from './farm.model';

export const ownershipTypeOptions: Array<{ label: string; value: OwnershipType }> = [
  { label: 'Owned', value: 'OWNED' },
  { label: 'Leased', value: 'LEASED' },
  { label: 'Shared', value: 'SHARED' },
  { label: 'Tenant Operated', value: 'TENANT_OPERATED' },
];

export const landSizeUnitOptions: Array<{ label: string; value: LandSizeUnit }> = [
  { label: 'Acres', value: 'ACRES' },
  { label: 'Hectares', value: 'HECTARES' },
  { label: 'Perches', value: 'PERCHES' },
];

export const soilTypeOptions: Array<{ label: string; value: SoilType }> = [
  { label: 'Clay', value: 'CLAY' },
  { label: 'Loam', value: 'LOAM' },
  { label: 'Sandy', value: 'SANDY' },
  { label: 'Silt', value: 'SILT' },
  { label: 'Mixed', value: 'MIXED' },
  { label: 'Unknown', value: 'UNKNOWN' },
];

export const irrigationTypeOptions: Array<{ label: string; value: IrrigationType }> = [
  { label: 'Rainfed', value: 'RAINFED' },
  { label: 'Canal', value: 'CANAL' },
  { label: 'Well', value: 'WELL' },
  { label: 'Tube Well', value: 'TUBE_WELL' },
  { label: 'Drip', value: 'DRIP' },
  { label: 'Sprinkler', value: 'SPRINKLER' },
  { label: 'Unknown', value: 'UNKNOWN' },
];

export const farmStatusOptions: Array<{ label: string; value: FarmStatus }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
];

function optionLabel<T extends string>(options: Array<{ label: string; value: T }>, value: T): string {
  return options.find((option) => option.value === value)?.label || value;
}

export const ownershipTypeLabel = (value: OwnershipType) => optionLabel(ownershipTypeOptions, value);
export const landSizeUnitLabel = (value: LandSizeUnit) => optionLabel(landSizeUnitOptions, value);
export const soilTypeLabel = (value: SoilType) => optionLabel(soilTypeOptions, value);
export const irrigationTypeLabel = (value: IrrigationType) => optionLabel(irrigationTypeOptions, value);
export const farmStatusLabel = (value: FarmStatus) => optionLabel(farmStatusOptions, value);

