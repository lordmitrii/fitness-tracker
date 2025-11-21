import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";

const languages = [
  { value: "en", label: "EN" },
  { value: "ru", label: "RU" },
  { value: "zh", label: "中文" },
];

interface LanguageSwitcherProps {
  mode?: "dropdown" | "buttons";
}

export default function LanguageSwitcher({
  mode = "dropdown",
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const { theme } = useTheme();

  const currentLanguage = i18n.language?.split("-")[0] || "en";

  if (mode === "buttons") {
    return (
      <View style={styles.buttonContainer}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.value}
            onPress={() => i18n.changeLanguage(lang.value)}
            style={[
              styles.languageButton,
              {
                backgroundColor:
                  currentLanguage === lang.value
                    ? theme.colors.button.primary.background
                    : theme.colors.card.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.languageButtonText,
                {
                  color:
                    currentLanguage === lang.value
                      ? theme.colors.button.primary.text
                      : theme.colors.text.primary,
                },
              ]}
            >
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }


  // dropdown button
  // TODO: add library like react-native-picker-select or react-native-dropdown-picker for better UX
  return (
    <TouchableOpacity
      style={[
        styles.dropdownButton,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => {
        // Cycle through languages or show a modal/picker
        const currentIndex = languages.findIndex(
          (l) => l.value === currentLanguage
        );
        const nextIndex = (currentIndex + 1) % languages.length;
        i18n.changeLanguage(languages[nextIndex].value);
      }}
    >
      <MaterialIcons
        name="language"
        size={20}
        color={theme.colors.text.primary}
      />
      <Text
        style={[styles.dropdownText, { color: theme.colors.text.primary }]}
      >
        {languages.find((l) => l.value === currentLanguage)?.label || "EN"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

