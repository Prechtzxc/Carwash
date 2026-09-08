export type FormActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string>;
};

// Keep the runtime initial value outside "use server" modules so client forms receive it directly.
export const initialFormActionState: FormActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};
