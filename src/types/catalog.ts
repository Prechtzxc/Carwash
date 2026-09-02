export const vehicleSizes = ["small", "medium", "large", "xl"] as const;

export type VehicleSize = (typeof vehicleSizes)[number];

export const vehicleSizeLabels: Record<VehicleSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  xl: "XL",
};
