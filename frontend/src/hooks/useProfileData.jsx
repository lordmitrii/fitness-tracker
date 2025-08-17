import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import api from "../api";

async function fetchProfile() {
  try {
    const res = await api.get("/users/profile");
    return res?.data ?? {};
  } catch (err) {
    if (err?.response?.status === 404) return {};
    throw err;
  }
}

export default function useProfileData() {
  const queryClient = useQueryClient();

  const { data, error, isLoading, isFetched, refetch, isFetching } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000, // 30 min
    placeholderData: (prev) => prev,
  });

  const setProfileCache = (next) => {
    queryClient.setQueryData(["profile"], (old) =>
      typeof next === "function" ? next(old ?? {}) : next
    );
  };

  const invalidateProfile = () =>
    queryClient.invalidateQueries({ queryKey: ["profile"] });

  const upsert = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put("/users/profile", payload);
      return res.data ?? {};
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["profile"] });
      const previous = queryClient.getQueryData(["profile"]);
      queryClient.setQueryData(["profile"], (old) => ({
        ...(old ?? {}),
        ...payload,
      }));
      return { previous };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.previous !== undefined)
        queryClient.setQueryData(["profile"], ctx.previous);
    },
    onSuccess: (serverData) => {
      queryClient.setQueryData(["profile"], serverData ?? {});
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const create = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/users/profile", payload);
      return res.data ?? {};
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["profile"] });
      const previous = queryClient.getQueryData(["profile"]);
      queryClient.setQueryData(["profile"], (old) => ({
        ...(old ?? {}),
        ...payload,
      }));
      return { previous };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.previous !== undefined)
        queryClient.setQueryData(["profile"], ctx.previous);
    },
    onSuccess: (serverData) => {
      queryClient.setQueryData(["profile"], serverData ?? {});
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return {
    profile: data ?? {},
    error,
    loading: isLoading,
    fetchedOnce: isFetched,
    refetch,
    isFetching,
    setProfileCache,
    invalidateProfile,
    mutations: { upsert, create },
  };
}
