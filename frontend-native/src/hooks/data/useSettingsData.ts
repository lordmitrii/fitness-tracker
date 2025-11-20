import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryObserverResult,
} from "@tanstack/react-query";

import api from "@/src/api";
import { QK } from "@/lib/utils/queryKeys";
import type { Settings } from "@/src/hooks/data/types";

export async function fetchSettings(): Promise<Settings> {
  const res = await api.get("users/settings");
  return (res?.data as Settings) ?? {};
}

async function patchSettings(partial: Partial<Settings>): Promise<Settings> {
  const res = await api.patch("users/settings", partial);
  return (res?.data as Settings) ?? {};
}

interface UseSettingsOptions {
  skipQuery?: boolean;
}

export default function useSettingsData(
  { skipQuery = false }: UseSettingsOptions = {}
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QK.settings,
    queryFn: fetchSettings,
    enabled: !skipQuery,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data: Settings | undefined) => data ?? {},
    placeholderData: (previous) => previous,
  });

  const mutation = useMutation<Settings, unknown, Partial<Settings>>({
    mutationFn: patchSettings,
    onMutate: async (partial) => {
      await queryClient.cancelQueries({ queryKey: QK.settings });
      const previous = queryClient.getQueryData<Settings>(QK.settings) ?? {};
      queryClient.setQueryData(QK.settings, (old: Settings | undefined) => ({
        ...(old ?? {}),
        ...(partial ?? {}),
      }));
      return { previous };
    },
    onError: (_error, _partial, context) => {
      if (context && typeof context === 'object' && 'previous' in context && context.previous !== undefined) {
        queryClient.setQueryData(QK.settings, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QK.settings, (old: Settings | undefined) => ({
        ...(old ?? {}),
        ...(data ?? {}),
      }));
    },
  });

  const updateSetting = useCallback(
    (key: string, value: unknown) =>
      mutation.mutateAsync({ [key]: value } as Partial<Settings>),
    [mutation]
  );

  const updateSettings = useCallback(
    (partial: Partial<Settings>) => mutation.mutateAsync(partial),
    [mutation]
  );

  const savingKey = useMemo(() => {
    if (!mutation.isPending || !mutation.variables) {
      return null;
    }
    const keys = Object.keys(mutation.variables);
    return keys.length ? keys[0] : null;
  }, [mutation.isPending, mutation.variables]);

  return useMemo(
    () => ({
      settings: query.data ?? {},
      loading: query.isLoading,
      fetching: query.isFetching,
      error: query.error ?? mutation.error,
      updateSetting,
      updateSettings,
      saving: mutation.isPending,
      savingKey,
      refetch: query.refetch as () => Promise<
        QueryObserverResult<Settings, unknown>
      >,
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

