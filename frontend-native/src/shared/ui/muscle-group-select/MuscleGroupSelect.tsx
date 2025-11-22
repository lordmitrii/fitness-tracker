import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  FlatList,
  Modal,
} from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type MuscleGroup = {
  id: string | number;
  name?: string | null;
  slug?: string | null;
};

interface MuscleGroupSelectProps {
  muscleGroups: MuscleGroup[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  required?: boolean;
}

export default function MuscleGroupSelect({
  muscleGroups,
  value,
  onChange,
  required = false,
}: MuscleGroupSelectProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = useMemo(() => {
    const group = muscleGroups.find((g) => String(g.id) === String(value));
    if (!group) return required ? "" : t("add_workout_exercise_modal.all_muscle_groups");
    if (group.slug) {
      const translated = t(`muscle_group.${group.slug}`);
      if (translated && translated !== `muscle_group.${group.slug}`) {
        return translated;
      }
    }
    return group.name || t("general.n_a");
  }, [muscleGroups, value, t, required]);

  const filteredGroups = useMemo(() => {
    const lower = search.trim().toLowerCase();
    if (!lower) return muscleGroups;
    return muscleGroups.filter((group) => {
      const label =
        group.slug && t(`muscle_group.${group.slug}`) !== `muscle_group.${group.slug}`
          ? t(`muscle_group.${group.slug}`)
          : group.name || "";
      return label.toLowerCase().includes(lower);
    });
  }, [muscleGroups, search, t]);

  const handleSelect = (group: MuscleGroup | null) => {
    setOpen(false);
    onChange(group ? group.id : null);
  };

  return (
    <>
      <Pressable
        style={[
          styles.field,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.input?.background || theme.colors.card.background,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <View>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            {t("add_workout_exercise_modal.muscle_group")}
          </Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>
            {selectedLabel || t("add_workout_exercise_modal.select_muscle_group")}
          </Text>
        </View>
        <MaterialIcons
          name="arrow-drop-down"
          size={24}
          color={theme.colors.text.secondary}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.card.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                {t("add_workout_exercise_modal.select_muscle_group")}
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.colors.text.secondary}
                />
              </Pressable>
            </View>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.colors.input?.background || theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
              value={search}
              onChangeText={setSearch}
              placeholder={t("add_workout_exercise_modal.search_muscle_groups")}
              placeholderTextColor={theme.colors.text.tertiary}
            />
            {!required && (
              <Pressable
                style={[
                  styles.option,
                  {
                    backgroundColor: theme.colors.card.background,
                  },
                ]}
                onPress={() => handleSelect(null)}
              >
                <Text style={{ color: theme.colors.button.primary.background }}>
                  {t("add_workout_exercise_modal.all_muscle_groups")}
                </Text>
              </Pressable>
            )}
            <FlatList
              data={filteredGroups}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={{ color: theme.colors.text.primary }}>
                    {item.slug && t(`muscle_group.${item.slug}`) !== `muscle_group.${item.slug}`
                      ? t(`muscle_group.${item.slug}`)
                      : item.name || t("general.n_a")}
                  </Text>
                </Pressable>
              )}
              style={styles.list}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  list: {
    marginTop: 8,
  },
});
