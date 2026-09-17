export const PHILIPPINE_MOBILE_PREFIX = "+63";
export const PHILIPPINE_MOBILE_LOCAL_LENGTH = 10;
export const PHILIPPINE_MOBILE_PLACEHOLDER = "9171489572";

export type PhilippineMobileValidation =
  | {
      valid: true;
      local: string;
      normalized: string;
    }
  | {
      valid: false;
      message: string;
    };

function getDigits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function getLocalDigits(value: string) {
  const digits = getDigits(value);

  if (digits.length === 12 && digits.startsWith("63")) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
}

export function sanitizePhilippineMobileInput(value: string) {
  return getLocalDigits(value).slice(0, PHILIPPINE_MOBILE_LOCAL_LENGTH);
}

export function getPhilippineMobileLocal(value: string) {
  return sanitizePhilippineMobileInput(value);
}

export function validatePhilippineMobile(value: string): PhilippineMobileValidation {
  const local = getLocalDigits(value);

  if (local.length !== PHILIPPINE_MOBILE_LOCAL_LENGTH) {
    return {
      valid: false,
      message: "Enter a complete 10-digit mobile number.",
    };
  }

  if (!local.startsWith("9")) {
    return {
      valid: false,
      message: "Philippine mobile numbers should begin with 9 after +63.",
    };
  }

  return {
    valid: true,
    local,
    normalized: `${PHILIPPINE_MOBILE_PREFIX}${local}`,
  };
}

export function normalizePhilippineMobile(value: string) {
  const result = validatePhilippineMobile(value);

  return result.valid ? result.normalized : null;
}

export function formatPhilippineMobile(value: string) {
  return normalizePhilippineMobile(value) ?? value;
}
