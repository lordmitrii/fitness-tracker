import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api";
import { QK } from "../../utils/queryKeys";
import { useMemo, useCallback } from "react";

export async function fetchSettings() {
  const res = await api.get("users/settings");
  return res?.data ?? {};
  // return {
  //   unit_system: "imperial",
  //   beta_opt_in: false,
  //   email_notifications: true,
  // };
}

async function patchSettings(partial) {
  const res = await api.patch("users/settings", partial);
  return res?.data ?? {};
}

export default function useSettingsData({ skipQuery = false } = {}) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: QK.settings,
    queryFn: fetchSettings,
    enabled: !skipQuery,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data) => data ?? {},
    placeholderData: (prev) => prev,
  });

  const mutation = useMutation({
    mutationFn: patchSettings,
    onMutate: async (partial) => {
      await qc.cancelQueries({ queryKey: QK.settings });
      const previous = qc.getQueryData(QK.settings) ?? {};
      qc.setQueryData(QK.settings, (old) => ({
        ...(old ?? {}),
        ...(partial ?? {}),
      }));
      return { previous };
    },
    onError: (_err, _partial, ctx) => {
      if (ctx?.previous) qc.setQueryData(QK.settings, ctx.previous);
    },
    onSuccess: (data) => {
      qc.setQueryData(QK.settings, (old) => ({
        ...(old ?? {}),
        ...(data ?? {}),
      }));
    },
    // onSettled: () => {
    //   qc.invalidateQueries({ queryKey: QK.settings });
    // },
  });

  const updateSetting = useCallback((key, value) => mutation.mutateAsync({ [key]: value }), [mutation]);
  const updateSettings = useCallback((partial) => mutation.mutateAsync(partial), [mutation]);

  const savingKey = useMemo(
    () =>
      mutation.isPending && mutation.variables
        ? Object.keys(mutation.variables)[0]
        : null,
    [mutation]
  );

  return useMemo(
    () => ({
      settings: query.data,
      loading: query.isLoading,
      fetching: query.isFetching,
      error: query.error || mutation.error,

      updateSetting,
      updateSettings,
      saving: mutation.isPending,
      savingKey,

      refetch: query.refetch,
    }),
    [
      query.data,
      query.isLoading,
      query.isFetching,
      query.error,
      mutation.error,
      mutation.isPending,
      savingKey,
      updateSetting,
      updateSettings,
      query.refetch,
    ]
  );
}
