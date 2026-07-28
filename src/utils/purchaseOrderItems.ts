export interface EditableItem {
  id?: string
  itemName: string
  description?: string
  quantity: number
  unit: string
  unitPrice?: number
  remarks?: string
}

export const createEmptyItem = (): EditableItem => ({
  itemName: "",
  description: "",
  quantity: 1,
  unit: "Pieces",
  unitPrice: 0,
  remarks: "",
})

/** Every row needs a non-empty item name and a quantity greater than 0. */
export const validateItems = (items: EditableItem[]): boolean =>
  items.length > 0 && items.every((item) => item.itemName.trim() !== "" && item.quantity > 0)
