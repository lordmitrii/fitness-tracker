import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api";
import { QK } from "../../utils/queryKeys";

export const fetchPlan = async (id) =>
  (await api.get(`/workout-plans/${id}`))?.data ?? {};

export default function useSinglePlanData(planID, { enabled = true } = {}) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: QK.plan(planID),
    queryFn: () => fetchPlan(planID),
    enabled: !!planID && enabled,
    placeholderData: () => {
      const list = qc.getQueryData(QK.plans);
      return list?.find((p) => String(p.id) === String(planID));
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data) => {
      if (!data) return data;
      const { __partial, ...rest } = data;
      return rest;
    },
    refetchOnMount: (q) => !!(q.state.data && q.state.data.__partial),
  });
}
