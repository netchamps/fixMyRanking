export type SelectionMatch = {
  reportKey: string;
  placeId: string;
  name: string;
  address: string;
  keyword: string;
  date: string | null;
  timestamp: number;
  matchType: "keyword" | "keyword_location" | "fallback_location";
  keywordScore: number;
  locationScore: number;
};

export type AnalysisSelectionRequired = {
  success: true;
  requiresSelection: true;
  message?: string;
  input: {
    location: string;
    keyword: string;
  };
  matches: SelectionMatch[];
};

export type AnalysisResult = {
  success: true;
  requiresSelection: false;
  message?: string;
  input: {
    location: string;
    keyword: string;
  };
  business: {
    placeId: string;
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
    rating: number | null;
    reviews: number | null;
    phone: string | null;
    website: string | null;
  };
  metrics: {
    points: number;
    foundIn: number;
    arp: number | null;
    atrp: number | null;
    solv: number | null;
    top3: number;
    top10: number;
    top20: number;
    notFound: number;
    top10Rate: number;
  };
  maps: {
    before: string | null;
    heatmap: string | null;
    afterDemo: string;
  };
  report: {
    key: string | null;
    publicUrl: string | null;
    pdf: string | null;
    date: string | null;
    timestamp: number | null;
  };
  selection: {
    matchType: "keyword" | "keyword_location" | "fallback_location";
    keywordScore: number;
    locationScore: number;
    candidates: number;
  };
};

export type AnalysisErrorPayload = {
  success: false;
  message?: string;
};

export type AnalysisPendingPayload = {
  success: true;
  requiresSelection: false;
  pending: true;
  message?: string;
  input: {
    location: string;
    keyword: string;
  };
  report?: {
    key?: string | null;
  };
};

export type AnalysisApiResponse =
  | AnalysisResult
  | AnalysisPendingPayload
  | AnalysisSelectionRequired
  | AnalysisErrorPayload;
