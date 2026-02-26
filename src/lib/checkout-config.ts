export type CheckoutPackage = "bronze" | "silver" | "gold";
export type CheckoutPaymentMethod = "paypal" | "card" | "sepa";

export type BillingFormData = {
  company: string;
  contact: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  vatId: string;
};

export type CheckoutPackageConfig = {
  badgeLabel: string;
  badgeClass: string;
  name: string;
  duration: string;
  monthlyPrice: number;
  totalPrice: number;
};

const PACKAGE_KEYS: CheckoutPackage[] = ["bronze", "silver", "gold"];
const PAYMENT_METHODS: CheckoutPaymentMethod[] = ["paypal", "card", "sepa"];

export const checkoutPackageData: Record<CheckoutPackage, CheckoutPackageConfig> = {
  bronze: {
    badgeLabel: "BRONZE",
    badgeClass: "bg-amber-700",
    name: "FixMyRanking Pro - Bronze",
    duration: "1 Monat",
    monthlyPrice: 98,
    totalPrice: 98,
  },
  silver: {
    badgeLabel: "SILVER",
    badgeClass: "bg-slate-600",
    name: "FixMyRanking Pro - Silber",
    duration: "3 Monate",
    monthlyPrice: 89.66,
    totalPrice: 269,
  },
  gold: {
    badgeLabel: "GOLD",
    badgeClass: "bg-yellow-600",
    name: "FixMyRanking Pro - Gold",
    duration: "12 Monate",
    monthlyPrice: 81.58,
    totalPrice: 979,
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export function isCheckoutPackage(value: unknown): value is CheckoutPackage {
  return typeof value === "string" && PACKAGE_KEYS.includes(value as CheckoutPackage);
}

export function isCheckoutPaymentMethod(
  value: unknown,
): value is CheckoutPaymentMethod {
  return (
    typeof value === "string" &&
    PAYMENT_METHODS.includes(value as CheckoutPaymentMethod)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseBillingFormData(payload: unknown): BillingFormData | null {
  if (!isRecord(payload)) {
    return null;
  }

  const company = normalizeText(payload.company, 120);
  const contact = normalizeText(payload.contact, 120);
  const street = normalizeText(payload.street, 160);
  const zip = normalizeText(payload.zip, 24);
  const city = normalizeText(payload.city, 120);
  const country = normalizeText(payload.country, 120);
  const email = normalizeText(payload.email, 254).toLowerCase();
  const phone = normalizeText(payload.phone, 50);
  const vatId = normalizeText(payload.vatId, 50);

  if (
    !company ||
    !contact ||
    !street ||
    !zip ||
    !city ||
    !country ||
    !email ||
    !phone
  ) {
    return null;
  }

  if (!EMAIL_REGEX.test(email)) {
    return null;
  }

  return {
    company,
    contact,
    street,
    zip,
    city,
    country,
    email,
    phone,
    vatId,
  };
}

export function toOptionalText(
  value: unknown,
  maxLength: number,
): string | undefined {
  const normalized = normalizeText(value, maxLength);
  return normalized || undefined;
}

export function getPackageTotalInCents(packageKey: CheckoutPackage): number {
  return Math.round(checkoutPackageData[packageKey].totalPrice * 100);
}
