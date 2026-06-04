const FARMER_CODE_PREFIX = 'FARMER-';

export async function generateFarmerCode(FarmerModel) {
  const latestFarmer = await FarmerModel.findOne({
    farmerCode: { $regex: `^${FARMER_CODE_PREFIX}\\d{4}$` },
  })
    .sort({ farmerCode: -1 })
    .select('farmerCode')
    .lean();

  if (!latestFarmer?.farmerCode) {
    return `${FARMER_CODE_PREFIX}0001`;
  }

  const latestNumber = Number(latestFarmer.farmerCode.replace(FARMER_CODE_PREFIX, ''));
  const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;

  return `${FARMER_CODE_PREFIX}${String(nextNumber).padStart(4, '0')}`;
}

