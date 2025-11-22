import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ExerciseFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  muscleFilter: string | number | "all";
  onClearFilters: () => void;
}

export default function ExerciseFilters({
  query,
  onQueryChange,
  muscleFilter,
  onClearFilters,
}: ExerciseFiltersProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const hasFilters = query.trim() || muscleFilter !== "all";

  return (
    <View style={styles.searchRow}>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            backgroundColor:
              theme.colors.input?.background || theme.colors.card.background,
            color: theme.colors.text.primary,
          },
        ]}
        value={query}
        onChangeText={onQueryChange}
        placeholder={t("admin.exercises.search_placeholder")}
        placeholderTextColor={theme.colors.text.tertiary}
      />
      <Pressable
        style={[
          styles.secondaryButton,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card.background,
            opacity: !hasFilters ? 0.5 : 1,
          },
        ]}
        onPress={onClearFilters}
        disabled={!hasFilters}
      >
        <Text style={{ color: theme.colors.text.primary }}>
          {t("general.clear")}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing[3.5],
    paddingVertical: theme.spacing[2.5],
    fontSize: theme.fontSize.md,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing[4],
    justifyContent: "center",
    alignItems: "center",
  },
});

