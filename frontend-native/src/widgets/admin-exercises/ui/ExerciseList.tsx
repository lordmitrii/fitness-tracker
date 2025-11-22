import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface Exercise {
  id: string | number;
  _label: string;
  is_time_based?: boolean;
  is_bodyweight?: boolean;
}

interface ExerciseListProps {
  exercises: Exercise[];
  editMode: boolean;
  onToggleEditMode: () => void;
  onDeleteExercise: (exerciseID: string | number) => void;
}

export default function ExerciseList({
  exercises,
  editMode,
  onToggleEditMode,
  onDeleteExercise,
}: ExerciseListProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          {t("admin.exercises.exercise_list")}
        </Text>
        <Pressable
          onPress={onToggleEditMode}
          style={styles.iconButton}
        >
          <MaterialIcons
            name={editMode ? "check" : "edit"}
            size={20}
            color={theme.colors.text.secondary}
          />
        </Pressable>
      </View>

      {exercises.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
          {t("admin.no_exercises")}
        </Text>
      ) : (
        exercises.map((exercise) => (
          <View
            key={exercise.id}
            style={[
              styles.exerciseRow,
              { borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.exerciseInfo}>
              <Text
                style={[styles.exerciseName, { color: theme.colors.text.primary }]}
                numberOfLines={1}
              >
                {exercise._label}
              </Text>
              <Text
                style={[styles.exerciseMeta, { color: theme.colors.text.secondary }]}
              >
                {exercise.is_time_based
                  ? t("admin.exercises.is_time_based")
                  : t("admin.exercises.not_time_based")}
                {" • "}
                {exercise.is_bodyweight
                  ? t("admin.exercises.is_bodyweight")
                  : t("admin.exercises.not_bodyweight")}
              </Text>
            </View>
            {editMode && (
              <Pressable
                onPress={() => onDeleteExercise(exercise.id)}
                style={styles.iconButton}
              >
                <MaterialIcons
                  name="delete"
                  size={20}
                  color={theme.colors.status.error.text}
                />
              </Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  sectionCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
  },
  iconButton: {
    padding: theme.spacing[1],
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: theme.spacing[2.5],
    gap: theme.spacing[3],
  },
  exerciseInfo: {
    flex: 1,
    gap: theme.spacing[1],
  },
  exerciseName: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  exerciseMeta: {
    fontSize: theme.fontSize.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    textAlign: "center",
  },
});

