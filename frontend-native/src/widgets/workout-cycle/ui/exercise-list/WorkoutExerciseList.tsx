import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { TFunction } from "i18next";
import SwipeableRow from "@/src/shared/ui/SwipeableRow";
import ActionMenu from "@/src/shared/ui/ActionMenu";

type UnitSystem = "metric" | "imperial";

type WorkoutSet = {
  id: string | number;
  index?: number;
  weight?: number | null;
  reps?: number | null;
  seconds?: number | null;
  completed?: boolean;
  skipped?: boolean;
};

type WorkoutExercise = {
  id: string | number;
  index?: number;
  workout_sets?: WorkoutSet[];
  individual_exercise?: {
    name?: string;
    is_bodyweight?: boolean;
    is_time_based?: boolean;
    muscle_group?: { slug?: string; name?: string | null };
    exercise?: { slug?: string };
  };
};

type Identifier = string | number;

interface WorkoutExerciseListProps {
  exercises?: WorkoutExercise[];
  unitSystem?: UnitSystem;
  onReplaceExercise?: (exerciseId: Identifier) => void;
  onDeleteExercise?: (exerciseId: Identifier) => void;
  enableSwipeable?: boolean;
  planID?: Identifier;
  cycleID?: Identifier;
  workoutID?: Identifier;
  onMoveExercise?: (workoutID: Identifier, exerciseID: Identifier, direction: "up" | "down") => Promise<void>;
  onSkipExercise?: (workoutID: Identifier, exerciseID: Identifier) => Promise<void>;
  onDeleteExerciseWithConfirm?: (workoutID: Identifier, exerciseID: Identifier) => Promise<void>;
  onMoveSet?: (workoutID: Identifier, exerciseID: Identifier, setID: Identifier, direction: "up" | "down") => Promise<void>;
  onAddSetAbove?: (workoutID: Identifier, exerciseID: Identifier, setIndex: number, setTemplate: any) => Promise<void>;
  onAddSetBelow?: (workoutID: Identifier, exerciseID: Identifier, setIndex: number, setTemplate: any) => Promise<void>;
  onSkipSet?: (workoutID: Identifier, exerciseID: Identifier, setID: Identifier) => Promise<void>;
  onDeleteSet?: (workoutID: Identifier, exerciseID: Identifier, setID: Identifier) => Promise<void>;
}

export default function WorkoutExerciseList({
  exercises = [],
  unitSystem = "metric",
  onReplaceExercise,
  onDeleteExercise,
  enableSwipeable = false,
  planID,
  cycleID,
  workoutID,
  onMoveExercise,
  onSkipExercise,
  onDeleteExerciseWithConfirm,
  onMoveSet,
  onAddSetAbove,
  onAddSetBelow,
  onSkipSet,
  onDeleteSet,
}: WorkoutExerciseListProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [menuExercise, setMenuExercise] = useState<WorkoutExercise | null>(null);
  const [menuSet, setMenuSet] = useState<{ set: WorkoutSet; exercise: WorkoutExercise } | null>(null);

  const sortedExercises = useMemo(() => {
    return (exercises || []).slice().sort((a, b) => {
      const aIndex = a.index ?? Number.MAX_SAFE_INTEGER;
      const bIndex = b.index ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
  }, [exercises]);

  const exerciseOrder = useMemo(() => {
    return sortedExercises.map((e) => ({ id: e.id, index: e.index ?? 0 }));
  }, [sortedExercises]);

  if (!sortedExercises.length) return null;

  const handleMenuOpen = (exercise: WorkoutExercise) => {
    setMenuExercise(exercise);
  };

  const handleMenuClose = () => {
    setMenuExercise(null);
  };

  const getMenuItems = (exercise: WorkoutExercise) => {
    if (!workoutID || !exercise.id) return [];

    const indices = exerciseOrder.map((e) => e.index);
    const maxIndex = indices.length > 0 ? Math.max(...indices) : 1;
    const currentIndex = exerciseOrder.find((e) => e.id === exercise.id)?.index ?? 1;
    const isOnlyExercise = exerciseOrder.length === 1;
    const isTop = currentIndex === 1;
    const isBottom = currentIndex === maxIndex;

    const exerciseCompleted = (exercise as any).completed ?? (exercise.workout_sets?.every((set) => set.completed) ?? false);
    const exerciseSkipped = (exercise as any).skipped ?? (exercise.workout_sets?.every((set) => set.skipped) ?? false);

    const items = [];

    if (!isTop && onMoveExercise) {
      items.push({
        label: t("menus.move_up") || "Move Up",
        icon: "arrow-upward" as const,
        onPress: async () => {
          if (workoutID && exercise.id) {
            await onMoveExercise(workoutID, exercise.id, "up");
          }
        },
      });
    }

    if (!(isOnlyExercise || isBottom) && onMoveExercise) {
      items.push({
        label: t("menus.move_down") || "Move Down",
        icon: "arrow-downward" as const,
        onPress: async () => {
          if (workoutID && exercise.id) {
            await onMoveExercise(workoutID, exercise.id, "down");
          }
        },
      });
    }

    if (onReplaceExercise) {
      items.push({
        label: t("menus.replace_exercise") || "Replace Exercise",
        icon: "swap-horiz" as const,
        onPress: () => {
          if (exercise.id) {
            onReplaceExercise(exercise.id);
          }
        },
      });
    }

    if (!(exerciseCompleted || exerciseSkipped) && onSkipExercise) {
      items.push({
        label: t("menus.skip_exercise") || "Skip Exercise",
        icon: "close" as const,
        onPress: async () => {
          if (workoutID && exercise.id) {
            await onSkipExercise(workoutID, exercise.id);
          }
        },
      });
    }

    if (onDeleteExerciseWithConfirm) {
      items.push({
        label: t("menus.delete_exercise") || "Delete Exercise",
        icon: "delete" as const,
        destructive: true,
        onPress: () => {
          if (workoutID && exercise.id) {
            Alert.alert(
              t("menus.confirm_delete_exercise_title") || "Delete Exercise",
              t("menus.confirm_delete_exercise") || "Are you sure you want to delete this exercise?",
              [
                {
                  text: t("general.cancel") || "Cancel",
                  style: "cancel",
                },
                {
                  text: t("general.delete") || "Delete",
                  style: "destructive",
                  onPress: async () => {
                    await onDeleteExerciseWithConfirm(workoutID, exercise.id);
                  },
                },
              ]
            );
          }
        },
      });
    }

    return items;
  };

  const renderExerciseCard = (exercise: WorkoutExercise) => {
    const cardContent = (
      <View
        style={[
          styles.exerciseCard,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card.background,
          },
        ]}
      >
          <View style={styles.exerciseHeader}>
            <Text style={[styles.exerciseTitle, { color: theme.colors.text.primary }]}>
              {exercise.index != null ? `${exercise.index}. ` : ""}
              {getExerciseLabel(exercise, t)}
            </Text>
            {(onReplaceExercise || onMoveExercise || onSkipExercise || onDeleteExerciseWithConfirm) && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleMenuOpen(exercise);
                }}
              >
                <MaterialIcons
                  name="more-vert"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </Pressable>
            )}
            {exercise.individual_exercise?.muscle_group && (
              <Text style={[styles.exerciseSubtitle, { color: theme.colors.text.secondary }]}>
                {t(
                  `muscle_group.${exercise.individual_exercise.muscle_group.slug}`,
                  exercise.individual_exercise.muscle_group.name || t("general.n_a")
                )}
              </Text>
            )}
          </View>

          <View style={styles.setsContainer}>
            <View style={styles.setsHeader}>
              <Text style={[styles.setsHeaderText, { color: theme.colors.text.secondary }]}>
                {t("workout_plan_single.set_label")}
              </Text>
              <Text style={[styles.setsHeaderText, { color: theme.colors.text.secondary }]}>
                {t("workout_plan_single.weight_label")} (
                {unitSystem === "metric"
                  ? t("measurements.weight.kg")
                  : t("measurements.weight.lbs_of")}
                )
              </Text>
              <Text style={[styles.setsHeaderText, { color: theme.colors.text.secondary }]}>
                {exercise.individual_exercise?.is_time_based
                  ? t("workout_plan_single.time_label")
                  : t("workout_plan_single.reps_label")}
              </Text>
              <Text style={[styles.setsHeaderText, { color: theme.colors.text.secondary }]}>
                {t("workout_plan_single.done_label")}
              </Text>
            </View>

            {(exercise.workout_sets || []).map((set, index) => {
              const setOrder = (exercise.workout_sets || []).map((s, i) => ({ id: s.id, index: s.index ?? i + 1 }));
              const setIndex = set.index ?? index + 1;
              const maxSetIndex = setOrder.length > 0 ? Math.max(...setOrder.map((s) => s.index)) : setIndex;
              const isOnlySet = setOrder.length === 1;
              const isTopSet = setIndex === 1;
              const isBottomSet = setIndex === maxSetIndex;
              const hasSetMenu = !!(onMoveSet || onAddSetAbove || onAddSetBelow || onSkipSet || onDeleteSet);

              return (
                <View
                  key={set.id ?? index}
                  style={[
                    styles.setRow,
                    {
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  {hasSetMenu ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setMenuSet({ set, exercise });
                      }}
                      style={styles.setMenuButton}
                    >
                      <MaterialIcons
                        name="more-vert"
                        size={18}
                        color={theme.colors.text.secondary}
                      />
                    </Pressable>
                  ) : (
                    <Text style={[styles.setIndex, { color: theme.colors.text.primary }]}>
                      {setIndex}
                    </Text>
                  )}
                  <Text style={[styles.setValue, { color: theme.colors.text.primary }]}>
                    {formatWeight(set.weight)}
                  </Text>
                  <Text style={[styles.setValue, { color: theme.colors.text.primary }]}>
                    {exercise.individual_exercise?.is_time_based
                      ? formatTime(t, set.seconds)
                      : formatReps(t, set.reps)}
                  </Text>
                  <View style={styles.setStatus}>
                    {renderStatusIcon(set, theme)}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      );

    if (enableSwipeable && (onReplaceExercise || onDeleteExercise)) {
      return (
        <SwipeableRow
          key={exercise.id}
          rightActions={[
            ...(onDeleteExercise
              ? [
                  {
                    label: t("general.delete") || "Delete",
                    icon: "delete" as const,
                    color: theme.colors.status?.error?.text || "#dc2626",
                    backgroundColor: theme.colors.status?.error?.background || "#fee2e2",
                    onPress: () => onDeleteExercise(exercise.id),
                  },
                ]
              : []),
            ...(onReplaceExercise
              ? [
                  {
                    label: t("general.replace") || "Replace",
                    icon: "swap-horiz" as const,
                    color: theme.colors.button.primary.text,
                    backgroundColor: theme.colors.button.primary.background,
                    onPress: () => onReplaceExercise(exercise.id),
                  },
                ]
              : []),
          ]}
        >
          {cardContent}
        </SwipeableRow>
      );
    }

    return <View key={exercise.id}>{cardContent}</View>;
  };

  const getSetMenuItems = (set: WorkoutSet, exercise: WorkoutExercise) => {
    if (!workoutID || !exercise.id || !set.id) return [];

    const setOrder = (exercise.workout_sets || []).map((s, i) => ({ id: s.id, index: s.index ?? i + 1 }));
    const setIndex = set.index ?? (exercise.workout_sets?.findIndex((s) => s.id === set.id) ?? 0) + 1;
    const maxSetIndex = setOrder.length > 0 ? Math.max(...setOrder.map((s) => s.index)) : setIndex;
    const isOnlySet = setOrder.length === 1;
    const isTopSet = setIndex === 1;
    const isBottomSet = setIndex === maxSetIndex;

    const items = [];

    if (!isTopSet && onMoveSet) {
      items.push({
        label: t("menus.move_up") || "Move Up",
        icon: "arrow-upward" as const,
        onPress: async () => {
          if (workoutID && exercise.id && set.id) {
            await onMoveSet(workoutID, exercise.id, set.id, "up");
          }
        },
      });
    }

    if (!(isOnlySet || isBottomSet) && onMoveSet) {
      items.push({
        label: t("menus.move_down") || "Move Down",
        icon: "arrow-downward" as const,
        onPress: async () => {
          if (workoutID && exercise.id && set.id) {
            await onMoveSet(workoutID, exercise.id, set.id, "down");
          }
        },
      });
    }

    if (onAddSetAbove) {
      items.push({
        label: t("menus.add_set_above") || "Add Set Above",
        icon: "add" as const,
        onPress: async () => {
          if (workoutID && exercise.id) {
            await onAddSetAbove(workoutID, exercise.id, setIndex, {
              weight: set.weight,
              reps: set.reps,
              seconds: set.seconds,
            });
          }
        },
      });
    }

    if (onAddSetBelow) {
      items.push({
        label: t("menus.add_set_below") || "Add Set Below",
        icon: "add" as const,
        onPress: async () => {
          if (workoutID && exercise.id) {
            await onAddSetBelow(workoutID, exercise.id, setIndex, {
              weight: set.weight,
              reps: set.reps,
              seconds: set.seconds,
            });
          }
        },
      });
    }

    if (!(set.completed || set.skipped) && onSkipSet) {
      items.push({
        label: t("menus.skip_set") || "Skip Set",
        icon: "close" as const,
        onPress: async () => {
          if (workoutID && exercise.id && set.id) {
            await onSkipSet(workoutID, exercise.id, set.id);
          }
        },
      });
    }

    if (!isOnlySet && onDeleteSet) {
      items.push({
        label: t("menus.delete_set") || "Delete Set",
        icon: "delete" as const,
        destructive: true,
        onPress: () => {
          if (workoutID && exercise.id && set.id) {
            Alert.alert(
              t("menus.confirm_delete_set_title") || "Delete Set",
              t("menus.confirm_delete_set") || "Are you sure you want to delete this set?",
              [
                {
                  text: t("general.cancel") || "Cancel",
                  style: "cancel",
                },
                {
                  text: t("general.delete") || "Delete",
                  style: "destructive",
                  onPress: async () => {
                    await onDeleteSet(workoutID, exercise.id, set.id);
                  },
                },
              ]
            );
          }
        },
      });
    }

    return items;
  };

  return (
    <>
      <View style={styles.container}>
        {sortedExercises.map(renderExerciseCard)}
      </View>
      {menuExercise && (
        <ActionMenu
          visible={!!menuExercise}
          onClose={handleMenuClose}
          items={getMenuItems(menuExercise)}
        />
      )}
      {menuSet && (
        <ActionMenu
          visible={!!menuSet}
          onClose={() => setMenuSet(null)}
          items={getSetMenuItems(menuSet.set, menuSet.exercise)}
        />
      )}
    </>
  );
}

function formatWeight(weight?: number | null) {
  if (weight == null) return "–";
  return Number(weight).toLocaleString();
}

function formatReps(t: TFunction, reps?: number | null) {
  if (reps == null) return "–";
  return `${reps} ${t("measurements.reps")}`;
}

function formatTime(t: TFunction, seconds?: number | null) {
  if (seconds == null) return "–";
  return `${seconds} ${t("measurements.seconds")}`;
}

function getExerciseLabel(exercise: WorkoutExercise, t: (key: string) => string) {
  if (exercise.individual_exercise?.exercise?.slug) {
    const translated = t(`exercise.${exercise.individual_exercise.exercise.slug}`);
    if (translated && translated !== `exercise.${exercise.individual_exercise.exercise.slug}`) {
      return translated;
    }
  }
  return exercise.individual_exercise?.name || t("general.unknown");
}

function renderStatusIcon(set: WorkoutSet, theme: any) {
  if (set.skipped) {
    return (
      <MaterialIcons
        name="close"
        size={18}
        color={theme.colors.error?.text || "#dc2626"}
      />
    );
  }

  if (set.completed) {
    return (
      <MaterialIcons
        name="check-circle"
        size={18}
        color={theme.colors.success?.text || "#16a34a"}
      />
    );
  }

  return (
    <MaterialIcons
      name="radio-button-unchecked"
      size={18}
      color={theme.colors.text.tertiary}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  exerciseHeader: {
    gap: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseSubtitle: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  setsContainer: {
    gap: 8,
  },
  setsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setsHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  setIndex: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  setMenuButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  setValue: {
    flex: 2,
    fontSize: 14,
  },
  setStatus: {
    width: 32,
    alignItems: "center",
  },
  messageContainer: {
    marginBottom: 8,
  },
});


