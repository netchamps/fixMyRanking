import { CheckoutPage } from "@/components/CheckoutPage";
import { isCheckoutPackage } from "@/lib/checkout-config";

type CheckoutRouteProps = {
  searchParams: Promise<{
    package?: string | string[];
    location?: string | string[];
    keyword?: string | string[];
    businessName?: string | string[];
  }>;
};

function parsePackage(value: string | string[] | undefined) {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";

  if (isCheckoutPackage(normalized)) {
    return normalized;
  }

  return undefined;
}

export default async function CheckoutRoute({ searchParams }: CheckoutRouteProps) {
  const params = await searchParams;

  return (
    <CheckoutPage
      initialPackage={parsePackage(params.package)}
      location={typeof params.location === "string" ? params.location.trim() : ""}
      keyword={typeof params.keyword === "string" ? params.keyword.trim() : ""}
      businessName={typeof params.businessName === "string" ? params.businessName.trim() : ""}
    />
  );
}
