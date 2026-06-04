import {
  CropStatus,
  CropType,
  CultivationAreaUnit,
  ExpectedYieldUnit,
  Season,
} from './crop.model';

export const cropTypeOptions: Array<{ label: string; value: CropType }> = [
  { label: 'Paddy', value: 'PADDY' },
  { label: 'Maize', value: 'MAIZE' },
  { label: 'Vegetables', value: 'VEGETABLES' },
  { label: 'Fruits', value: 'FRUITS' },
  { label: 'Tea', value: 'TEA' },
  { label: 'Coconut', value: 'COCONUT' },
  { label: 'Rubber', value: 'RUBBER' },
  { label: 'Other', value: 'OTHER' },
];

export const seasonOptions: Array<{ label: string; value: Season }> = [
  { label: 'Maha', value: 'MAHA' },
  { label: 'Yala', value: 'YALA' },
  { label: 'Inter Season', value: 'INTER_SEASON' },
  { label: 'Year Round', value: 'YEAR_ROUND' },
];

export const cultivationAreaUnitOptions: Array<{ label: string; value: CultivationAreaUnit }> = [
  { label: 'Acres', value: 'ACRES' },
  { label: 'Hectares', value: 'HECTARES' },
  { label: 'Perches', value: 'PERCHES' },
];

export const expectedYieldUnitOptions: Array<{ label: string; value: ExpectedYieldUnit }> = [
  { label: 'Kg', value: 'KG' },
  { label: 'MT', value: 'MT' },
  { label: 'Bags', value: 'BAGS' },
  { label: 'Units', value: 'UNITS' },
];

export const cropStatusOptions: Array<{ label: string; value: CropStatus }> = [
  { label: 'Planned', value: 'PLANNED' },
  { label: 'Planted', value: 'PLANTED' },
  { label: 'Growing', value: 'GROWING' },
  { label: 'Harvested', value: 'HARVESTED' },
  { label: 'Damaged', value: 'DAMAGED' },
  { label: 'Failed', value: 'FAILED' },
];

function optionLabel<T extends string>(options: Array<{ label: string; value: T }>, value: T): string {
  return options.find((option) => option.value === value)?.label || value;
}

export const cropTypeLabel = (value: CropType) => optionLabel(cropTypeOptions, value);
export const seasonLabel = (value: Season) => optionLabel(seasonOptions, value);
export const cultivationAreaUnitLabel = (value: CultivationAreaUnit) =>
  optionLabel(cultivationAreaUnitOptions, value);
export const expectedYieldUnitLabel = (value: ExpectedYieldUnit) =>
  optionLabel(expectedYieldUnitOptions, value);
export const cropStatusLabel = (value: CropStatus) => optionLabel(cropStatusOptions, value);

