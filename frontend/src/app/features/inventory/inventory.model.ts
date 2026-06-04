export type InventoryCategory = 'FERTILIZER' | 'SEED' | 'EQUIPMENT' | 'OTHER';
export type InventoryStatus = 'ACTIVE' | 'INACTIVE';
export type ReservationStatus = 'RESERVED' | 'CANCELLED' | 'ISSUED';

export interface InventoryItem {
  _id: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  availableQuantity: number;
  reservedQuantity: number;
  distributedQuantity: number;
  unit: string;
  warehouseName: string;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryReservation {
  _id: string;
  reservationCode: string;
  enrollment: string;
  enrollmentCode: string;
  farmer: string;
  farmerCode: string;
  farmerName: string;
  farm: string;
  farmCode: string;
  crop: string;
  cropCode: string;
  programCode: string;
  programName: string;
  entitlement: string;
  itemCode: string;
  itemName: string;
  reservedQuantity: number;
  unit: string;
  warehouseName: string;
  reservationStatus: ReservationStatus;
  reservedBy: string;
  reservedAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryReservationPayload {
  enrollmentId: string;
  reservedBy: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

