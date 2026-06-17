import { useQuery } from "@tanstack/react-query";

import { api, type LabTest } from "@/lib/api";

export function useLabTests() {
  return useQuery<LabTest[]>({
    queryKey: ["lab-tests"],
    queryFn: api.listLabTests,
  });
}
