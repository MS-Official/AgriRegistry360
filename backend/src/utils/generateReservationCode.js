const RESERVATION_CODE_PREFIX = 'RESERVE-';

export async function generateReservationCode(InventoryReservationModel) {
  const latestReservation = await InventoryReservationModel.findOne({
    reservationCode: { $regex: `^${RESERVATION_CODE_PREFIX}\\d{4}$` },
  })
    .sort({ reservationCode: -1 })
    .select('reservationCode')
    .lean();

  if (!latestReservation?.reservationCode) {
    return `${RESERVATION_CODE_PREFIX}0001`;
  }

  const latestNumber = Number(
    latestReservation.reservationCode.replace(RESERVATION_CODE_PREFIX, '')
  );
  const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;

  return `${RESERVATION_CODE_PREFIX}${String(nextNumber).padStart(4, '0')}`;
}

