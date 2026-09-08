export type PublicVehicleCategory = {
  id: string;
  name: string;
};

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
};

export type PublicServicePrice = {
  serviceId: string;
  vehicleCategoryId: string;
  price: number;
};

export type PublicShopProduct = {
  id: string;
  name: string;
  description: string | null;
  sellingPrice: number;
};

export type PublicCheckInCatalog = {
  vehicleCategories: PublicVehicleCategory[];
  services: PublicService[];
  servicePrices: PublicServicePrice[];
  shopProducts: PublicShopProduct[];
};

export type CheckInProductLine = {
  inventoryItemId: string;
  quantity: number;
};

export type CheckInSuccessService = {
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CheckInSuccessProduct = {
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CheckInSuccessResult = {
  transactionNumber: string;
  customerName: string;
  vehicleCategoryName: string;
  vehicleDetails: {
    plateNumber: string | null;
    make: string | null;
    model: string | null;
    color: string | null;
  };
  serviceSubtotal: number;
  productSubtotal: number;
  total: number;
  services: CheckInSuccessService[];
  products: CheckInSuccessProduct[];
};
