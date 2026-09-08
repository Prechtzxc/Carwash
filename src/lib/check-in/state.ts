import type { CheckInSuccessResult } from "@/types/check-in";

export type CheckInActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string>;
  result: CheckInSuccessResult | null;
};

export const initialCheckInActionState: CheckInActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  result: null,
};
