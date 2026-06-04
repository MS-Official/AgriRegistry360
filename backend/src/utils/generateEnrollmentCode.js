const ENROLLMENT_CODE_PREFIX = 'ENROLL-';

export async function generateEnrollmentCode(EnrollmentModel) {
  const latestEnrollment = await EnrollmentModel.findOne({
    enrollmentCode: { $regex: `^${ENROLLMENT_CODE_PREFIX}\\d{4}$` },
  })
    .sort({ enrollmentCode: -1 })
    .select('enrollmentCode')
    .lean();

  if (!latestEnrollment?.enrollmentCode) {
    return `${ENROLLMENT_CODE_PREFIX}0001`;
  }

  const latestNumber = Number(latestEnrollment.enrollmentCode.replace(ENROLLMENT_CODE_PREFIX, ''));
  const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;

  return `${ENROLLMENT_CODE_PREFIX}${String(nextNumber).padStart(4, '0')}`;
}

