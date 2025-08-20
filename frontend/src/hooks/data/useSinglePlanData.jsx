import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api";
import { QK } from "../../utils/queryKeys";

const fetchPlan = async (id) =>
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
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (d) => d ?? {},
  });
}
