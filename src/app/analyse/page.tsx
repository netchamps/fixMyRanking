import { AnalysisResultPage } from "@/components/AnalysisResultPage";
import type { PreselectedLocation } from "@/types/preselected-location";

type AnalysePageProps = {
  searchParams: Promise<{
    location?: string | string[];
    keyword?: string | string[];
    placeId?: string | string[];
    lat?: string | string[];
    lng?: string | string[];
    businessName?: string | string[];
    businessAddress?: string | string[];
    businessRating?: string | string[];
    businessReviews?: string | string[];
    businessPhone?: string | string[];
    businessUrl?: string | string[];
  }>;
};

export default async function AnalysePage({ searchParams }: AnalysePageProps) {
  const params = await searchParams;
  const location = typeof params.location === "string" ? params.location.trim() : "";
  const keyword = typeof params.keyword === "string" ? params.keyword.trim() : "";
  const placeId = typeof params.placeId === "string" ? params.placeId.trim() : "";
  const lat = typeof params.lat === "string" ? Number.parseFloat(params.lat) : Number.NaN;
  const lng = typeof params.lng === "string" ? Number.parseFloat(params.lng) : Number.NaN;

  const selectedLocation: PreselectedLocation | null =
    placeId && Number.isFinite(lat) && Number.isFinite(lng)
      ? {
          placeId,
          name: typeof params.businessName === "string" ? params.businessName.trim() : location,
          address:
            typeof params.businessAddress === "string"
              ? params.businessAddress.trim()
              : location,
          lat,
          lng,
          rating:
            typeof params.businessRating === "string"
              ? Number.isFinite(Number.parseFloat(params.businessRating))
                ? Number.parseFloat(params.businessRating)
                : null
              : null,
          reviews:
            typeof params.businessReviews === "string"
              ? Number.isFinite(Number.parseFloat(params.businessReviews))
                ? Number.parseFloat(params.businessReviews)
                : null
              : null,
          phone: typeof params.businessPhone === "string" ? params.businessPhone.trim() : null,
          website: typeof params.businessUrl === "string" ? params.businessUrl.trim() : null,
        }
      : null;

  return (
    <AnalysisResultPage
      location={location}
      keyword={keyword}
      selectedLocation={selectedLocation}
    />
  );
}
