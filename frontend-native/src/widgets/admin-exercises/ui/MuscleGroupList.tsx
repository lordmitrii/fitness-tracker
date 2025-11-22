import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

type FilterValue = string | number | "all";

interface MuscleGroup {
  id: string | number;
  _label: string;
}

interface MuscleGroupListProps {
  muscleGroups: MuscleGroup[];
  editMode: boolean;
  muscleFilter: FilterValue;
  exerciseCountByMuscle: Map<string, number>;
  onToggleEditMode: () => void;
  onFilterChange: (filter: FilterValue) => void;
  onDeleteMuscle: (muscleID: string | number) => void;
}

export default function MuscleGroupList({
  muscleGroups,
  editMode,
  muscleFilter,
  exerciseCountByMuscle,
  onToggleEditMode,
  onFilterChange,
  onDeleteMuscle,
}: MuscleGroupListProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const sortedMuscles = [...muscleGroups].sort((a, b) =>
    a._label.localeCompare(b._label)
  );

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
          {t("admin.exercises.muscles_title")}
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
      <Text style={[styles.sectionHint, { color: theme.colors.text.secondary }]}>
        {t("admin.exercises.muscles_hint")}
      </Text>

      {sortedMuscles.map((muscle) => {
        const count = exerciseCountByMuscle.get(String(muscle.id)) || 0;
        const active =
          muscleFilter !== "all" &&
          String(muscleFilter) === String(muscle.id);
        return (
          <Pressable
            key={muscle.id}
            style={[
              styles.muscleRow,
              {
                borderColor: theme.colors.border,
                backgroundColor: active
                  ? theme.colors.button.secondary?.background ||
                    theme.colors.card.background
                  : theme.colors.card.background,
              },
            ]}
            onPress={() => onFilterChange(active ? "all" : (muscle.id as FilterValue))}
          >
            <Text
              style={[
                styles.muscleName,
                { color: theme.colors.text.primary },
              ]}
            >
              {muscle._label}
            </Text>
            {editMode ? (
              <Pressable
                onPress={() => onDeleteMuscle(muscle.id)}
                style={styles.iconButton}
              >
                <MaterialIcons
                  name="delete"
                  size={20}
                  color={theme.colors.status.error.text}
                />
              </Pressable>
            ) : (
              <View
                style={[
                  styles.countBadge,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                  },
                ]}
              >
                <Text
                  style={{ color: theme.colors.text.primary, fontWeight: "600" }}
                >
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
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
  sectionHint: {
    fontSize: theme.fontSize['sm-md'],
  },
  iconButton: {
    padding: theme.spacing[1],
  },
  muscleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: theme.spacing[2.5],
    paddingHorizontal: theme.spacing[1],
    borderRadius: theme.borderRadius.lg,
  },
  muscleName: {
    fontSize: theme.fontSize['md-sm'],
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: theme.spacing[2.5],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
  },
});

