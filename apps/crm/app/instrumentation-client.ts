/** Subset of `web-vitals` Metric — keeps `tsc` happy without pinning the dependency in CRM. */
type CrmWebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating?: string;
  navigationType?: string;
};

function shouldLogVitals(): boolean {
  if (typeof process === "undefined") return false;
  return process.env.NODE_ENV === "production";
}

export function reportWebVitals(metric: CrmWebVitalsMetric) {
  if (!shouldLogVitals()) return;

  const payload = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
    pathname: typeof window !== "undefined" ? window.location.pathname : "",
  };

  // Non-blocking local signal until a persistent metrics sink is wired.
  console.info("[web-vitals][crm]", payload);
}
