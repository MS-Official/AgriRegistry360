import { InventoryItem } from '../models/inventoryItem.model.js';

const demoInventoryItem = {
  itemCode: 'FERTILIZER_50KG',
  itemName: 'Fertilizer 50KG Bag',
  category: 'FERTILIZER',
  availableQuantity: 500,
  reservedQuantity: 0,
  distributedQuantity: 0,
  unit: 'BAG',
  warehouseName: 'Anuradhapura Agriculture Warehouse',
  status: 'ACTIVE',
};

export async function seedDemoInventory() {
  const existingItem = await InventoryItem.findOne({
    itemCode: demoInventoryItem.itemCode,
  }).lean();

  if (existingItem) {
    return existingItem;
  }

  return InventoryItem.create(demoInventoryItem);
}

