const CROP_CODE_PREFIX = 'CROP-';

export async function generateCropCode(CropModel) {
  const latestCrop = await CropModel.findOne({
    cropCode: { $regex: `^${CROP_CODE_PREFIX}\\d{4}$` },
  })
    .sort({ cropCode: -1 })
    .select('cropCode')
    .lean();

  if (!latestCrop?.cropCode) {
    return `${CROP_CODE_PREFIX}0001`;
  }

  const latestNumber = Number(latestCrop.cropCode.replace(CROP_CODE_PREFIX, ''));
  const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;

  return `${CROP_CODE_PREFIX}${String(nextNumber).padStart(4, '0')}`;
}

