export const vehicleSizes = ["motor", "big_bike", "small", "medium", "large", "xl"] as const;

export type VehicleSize = (typeof vehicleSizes)[number];

export const vehicleSizeLabels: Record<VehicleSize, string> = {
  motor: "Motor",
  big_bike: "Big Bike",
  small: "Small",
  medium: "Medium",
  large: "Large",
  xl: "XL",
};
