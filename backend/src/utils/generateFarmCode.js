const FARM_CODE_PREFIX = 'FARM-LAND-';

export async function generateFarmCode(FarmModel) {
  const latestFarm = await FarmModel.findOne({
    farmCode: { $regex: `^${FARM_CODE_PREFIX}\\d{4}$` },
  })
    .sort({ farmCode: -1 })
    .select('farmCode')
    .lean();

  if (!latestFarm?.farmCode) {
    return `${FARM_CODE_PREFIX}0001`;
  }

  const latestNumber = Number(latestFarm.farmCode.replace(FARM_CODE_PREFIX, ''));
  const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;

  return `${FARM_CODE_PREFIX}${String(nextNumber).padStart(4, '0')}`;
}

