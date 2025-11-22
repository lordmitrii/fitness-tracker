import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";

import api from "@/src/shared/api";
import { QK } from "@/src/shared/utils/query";
import type {
  Exercise,
  ExerciseBundle,
  MuscleGroup,
  Identifier,
} from "@/src/shared/api/Types";

async function fetchExercisesBundle(): Promise<ExerciseBundle> {
  const [resExercises, resIndividuals, resMuscles] = await Promise.all([
    api.get("exercises/"),
    api.get("individual-exercises"),
    api.get("muscle-groups/"),
  ]);

  const pool = ((resExercises?.data as Exercise[]) ?? []).map((exercise) => ({
    ...exercise,
    source: "pool" as const,
  }));

  const customs = ((resIndividuals?.data as Exercise[]) ?? [])
    .filter((exercise) => !exercise.exercise_id)
    .map((exercise) => ({
      ...exercise,
      source: "custom" as const,
    }));

  return {
    exercises: [...pool, ...customs],
    muscleGroups: ((resMuscles?.data as MuscleGroup[]) ?? []).slice(),
    poolOnlyExercises: pool,
  };
}

type ExercisesCacheUpdater =
  | ExerciseBundle
  | ((current: ExerciseBundle) => ExerciseBundle);

interface UseExercisesDataResult extends ExerciseBundle {
  error: unknown;
  loading: boolean;
  fetchedOnce: boolean;
  refetch: () => Promise<unknown>;
  isFetching: boolean;
  setExercisesCache: (next: ExercisesCacheUpdater) => void;
  invalidateExercisesBundle: () => void;
  mutations: {
    createIndividualExercise: UseMutationResult<
      Exercise,
      unknown,
      CreateIndividualExercisePayload,
      unknown
    >;
    attachWorkoutExercise: UseMutationResult<
      unknown,
      unknown,
      AttachWorkoutExercisePayload,
      unknown
    >;
    createExercise: UseMutationResult<
      Exercise,
      unknown,
      CreateExercisePayload,
      unknown
    >;
    updateExercise: UseMutationResult<
      Exercise,
      unknown,
      UpdateExercisePayload,
      unknown
    >;
    deleteExercise: UseMutationResult<
      Identifier,
      unknown,
      Identifier,
      unknown
    >;
    createMuscleGroup: UseMutationResult<
      MuscleGroup,
      unknown,
      CreateMuscleGroupPayload,
      unknown
    >;
    updateMuscleGroup: UseMutationResult<
      MuscleGroup,
      unknown,
      UpdateMuscleGroupPayload,
      unknown
    >;
    deleteMuscleGroup: UseMutationResult<
      Identifier,
      unknown,
      Identifier,
      unknown
    >;
  };
}

interface UseExercisesDataOptions {
  onError?: (error: unknown) => void;
}

interface CreateIndividualExercisePayload {
  exercise_id?: Identifier;
  name?: string;
  muscle_group_id?: Identifier;
  is_bodyweight?: boolean;
  is_time_based?: boolean;
}

interface AttachWorkoutExercisePayload {
  planID: Identifier;
  cycleID: Identifier;
  workoutID: Identifier;
  replaceExerciseID?: Identifier;
  individual_exercise_id: Identifier;
  sets_qt?: number;
}

interface CreateExercisePayload {
  name: string;
  muscle_group_id?: Identifier;
  auto_translate?: boolean;
  is_time_based?: boolean;
  is_bodyweight?: boolean;
}

interface UpdateExercisePayload {
  id: Identifier;
  name?: string;
  muscle_group_id?: Identifier;
}

interface CreateMuscleGroupPayload {
  name: string;
  auto_translate?: boolean;
}

interface UpdateMuscleGroupPayload {
  id: Identifier;
  name: string;
}

export default function useExercisesData(
  onError?: UseExercisesDataOptions["onError"]
): UseExercisesDataResult {
  const queryClient = useQueryClient();

  const {
    data,
    error,
    isLoading,
    isFetched,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: QK.exercisesBundle,
    queryFn: fetchExercisesBundle,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (result: ExerciseBundle | undefined) =>
      result ?? {
        exercises: [],
        muscleGroups: [],
        poolOnlyExercises: [],
      },
    placeholderData: (previous) => previous,
  });

  const setExercisesCache = useCallback(
    (next: ExercisesCacheUpdater) => {
      queryClient.setQueryData(
        QK.exercisesBundle,
        (old: ExerciseBundle | undefined) => {
          const fallback: ExerciseBundle = {
            exercises: [],
            muscleGroups: [],
            poolOnlyExercises: [],
          };
          const base = old ?? fallback;
          const result =
            typeof next === "function"
              ? (next as (current: ExerciseBundle) => ExerciseBundle)(base)
              : next;

          return {
            exercises: result?.exercises ?? base.exercises,
            muscleGroups: result?.muscleGroups ?? base.muscleGroups,
            poolOnlyExercises:
              result?.poolOnlyExercises ?? base.poolOnlyExercises,
          };
        }
      );
    },
    [queryClient]
  );

  const invalidateExercisesBundle = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QK.exercisesBundle }).catch(() => {});
  }, [queryClient]);

  const createIndividualExercise = useMutation({
    mutationFn: async (payload: CreateIndividualExercisePayload) => {
      const { data: response } = await api.post("individual-exercises", payload);
      return response as Exercise;
    },
    onSuccess: (individualExercise) => {
      if (!individualExercise?.exercise_id) {
        queryClient.setQueryData(
          QK.exercisesBundle,
          (old: ExerciseBundle | undefined) => {
            if (!old) return old;
            const exists = old.exercises.some((exercise) => {
              if (exercise.source === "custom") {
                return (
                  exercise.name === individualExercise.name &&
                  String(exercise.muscle_group_id ?? "") ===
                    String(individualExercise.muscle_group_id ?? "")
                );
              }
              return false;
            });
            if (exists) return old;
            return {
              ...old,
              exercises: [
                ...old.exercises,
                { ...individualExercise, source: "custom" as const },
              ],
            };
          }
        );
      }
    },
    onError,
  });

  const attachWorkoutExercise = useMutation({
    mutationFn: async (payload: AttachWorkoutExercisePayload) => {
      const base = `/workout-plans/${payload.planID}/workout-cycles/${payload.cycleID}/workouts/${payload.workoutID}`;
      if (payload.replaceExerciseID) {
        const { data: response } = await api.post(
          `${base}/workout-exercises/${payload.replaceExerciseID}/replace`,
          {
            individual_exercise_id: payload.individual_exercise_id,
            sets_qt: payload.sets_qt,
          }
        );
        return response;
      }
      const { data: response } = await api.post(`${base}/workout-exercises`, {
        individual_exercise_id: payload.individual_exercise_id,
        sets_qt: payload.sets_qt,
      });
      return response;
    },
    onError,
  });

  const createExercise = useMutation({
    mutationFn: async (payload: CreateExercisePayload) => {
      const { data: response } = await api.post("exercises/", payload);
      return response as Exercise;
    },
    onSuccess: (newExercise) => {
      queryClient.setQueryData(
        QK.exercisesBundle,
        (old: ExerciseBundle | undefined) => {
          if (!old) return old;
          return {
            ...old,
            exercises: [...old.exercises, newExercise],
            poolOnlyExercises: [...old.poolOnlyExercises, newExercise],
          };
        }
      );
    },
  });

  const updateExercise = useMutation({
    mutationFn: async (exercise: UpdateExercisePayload) => {
      const { id, name, muscle_group_id } = exercise;
      const { data: response } = await api.put(`exercises/${id}`, {
        name,
        muscle_group_id,
      });
      return response as Exercise;
    },
    onSuccess: (updatedExercise) => {
      queryClient.setQueryData(
        QK.exercisesBundle,
        (old: ExerciseBundle | undefined) => {
          if (!old) return old;
          return {
            ...old,
            exercises: old.exercises.map((exercise) =>
              exercise.id === updatedExercise.id ? updatedExercise : exercise
            ),
          };
        }
      );
    },
  });

  const deleteExercise = useMutation({
    mutationFn: async (exerciseID: Identifier) => {
      await api.delete(`exercises/${exerciseID}`);
      return exerciseID;
    },
    onSuccess: (deletedExerciseID) => {
      queryClient.setQueryData(
        QK.exercisesBundle,
        (old: ExerciseBundle | undefined) => {
          if (!old) return old;
          return {
            ...old,
            exercises: old.exercises.filter(
              (exercise) => exercise.id !== deletedExerciseID
            ),
            poolOnlyExercises: old.poolOnlyExercises.filter(
              (exercise) => exercise.id !== deletedExerciseID
            ),
          };
        }
      );
    },
  });

  const createMuscleGroup = useMutation({
    mutationFn: async (payload: CreateMuscleGroupPayload) => {
      const { data: response } = await api.post("muscle-groups/", payload);
      return response as MuscleGroup;
    },
    onSuccess: (newMuscleGroup) => {
      queryClient.setQueryData(
        QK.exercisesBundle,
        (old: ExerciseBundle | undefined) => {
          if (!old) return old;
          return {
            ...old,
            muscleGroups: [...old.muscleGroups, newMuscleGroup],
          };
        }
      );
    },
  });

  const updateMuscleGroup = useMutation({
    mutationFn: async (payload: UpdateMuscleGroupPayload) => {
      const { id, name } = payload;
      const { data: response } = await api.put(`muscle-groups/${id}`, {
        name,
      });
      return response as MuscleGroup;
    },
    onSuccess: (updatedMuscleGroup) => {
      queryClient.setQueryData(
        QK.exercisesBundle,
        (old: ExerciseBundle | undefined) => {
          if (!old) return old;
          return {
            ...old,
            muscleGroups: old.muscleGroups.map((muscleGroup) =>
              muscleGroup.id === updatedMuscleGroup.id
                ? updatedMuscleGroup
                : muscleGroup
            ),
          };
        }
      );
    },
  });

  const deleteMuscleGroup = useMutation({
    mutationFn: async (muscleGroupID: Identifier) => {
      await api.delete(`muscle-groups/${muscleGroupID}`);
      return muscleGroupID;
    },
    onSuccess: (deletedMuscleGroupID) => {
      queryClient.setQueryData(
        QK.exercisesBundle,
        (old: ExerciseBundle | undefined) => {
          if (!old) return old;
          return {
            ...old,
            muscleGroups: old.muscleGroups.filter(
              (muscleGroup) => muscleGroup.id !== deletedMuscleGroupID
            ),
          };
        }
      );
    },
  });

  return useMemo(
    () => ({
      exercises: data?.exercises ?? [],
      muscleGroups: data?.muscleGroups ?? [],
      poolOnlyExercises: data?.poolOnlyExercises ?? [],
      error,
      loading: isLoading,
      fetchedOnce: isFetched,
      refetch,
      isFetching,
      setExercisesCache,
      invalidateExercisesBundle,
      mutations: {
        createIndividualExercise,
        attachWorkoutExercise,
        createExercise,
        updateExercise,
        deleteExercise,
        createMuscleGroup,
        updateMuscleGroup,
        deleteMuscleGroup,
      },
    }),
    [
      data,
      error,
      isLoading,
      isFetched,
      refetch,
      isFetching,
      setExercisesCache,
      invalidateExercisesBundle,
      createIndividualExercise,
      attachWorkoutExercise,
      createExercise,
      updateExercise,
      deleteExercise,
      createMuscleGroup,
      updateMuscleGroup,
      deleteMuscleGroup,
    ]
  );
}

