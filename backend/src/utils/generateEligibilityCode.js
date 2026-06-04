const ELIGIBILITY_CODE_PREFIX = 'ELIG-';

export async function generateEligibilityCode(EligibilityModel) {
  const latestEligibility = await EligibilityModel.findOne({
    eligibilityCode: { $regex: `^${ELIGIBILITY_CODE_PREFIX}\\d{4}$` },
  })
    .sort({ eligibilityCode: -1 })
    .select('eligibilityCode')
    .lean();

  if (!latestEligibility?.eligibilityCode) {
    return `${ELIGIBILITY_CODE_PREFIX}0001`;
  }

  const latestNumber = Number(latestEligibility.eligibilityCode.replace(ELIGIBILITY_CODE_PREFIX, ''));
  const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;

  return `${ELIGIBILITY_CODE_PREFIX}${String(nextNumber).padStart(4, '0')}`;
}

