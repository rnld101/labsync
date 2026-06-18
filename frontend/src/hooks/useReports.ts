import { useQuery } from "@tanstack/react-query";

import { api, type Report } from "@/lib/api";

export function useReports() {
  return useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: api.listReports,
    // Poll while any report is still in-progress (neither ready nor failed).
    refetchInterval: (query) =>
      query.state.data?.some((r) => !r.has_summary && !r.processing_failed) ? 4000 : false,
  });
}
