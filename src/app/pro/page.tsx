import { ProPage } from "@/components/ProPage";

type ProRouteProps = {
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

  if (normalized === "bronze" || normalized === "silver" || normalized === "gold") {
    return normalized;
  }

  return undefined;
}

export default async function ProRoute({ searchParams }: ProRouteProps) {
  const params = await searchParams;

  return (
    <ProPage
      initialPackage={parsePackage(params.package)}
      location={typeof params.location === "string" ? params.location.trim() : ""}
      keyword={typeof params.keyword === "string" ? params.keyword.trim() : ""}
      businessName={typeof params.businessName === "string" ? params.businessName.trim() : ""}
    />
  );
}
