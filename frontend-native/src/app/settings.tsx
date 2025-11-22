import { useState, useCallback } from "react";
import { ScrollView, StyleSheet, Pressable, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";
import { useSettingsData } from "@/src/entities/settings";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";

import {
  SettingSection,
  SettingSwitch,
  SettingPicker,
} from "@/src/widgets/settings";
import {
  useUpdateSetting,
  useSettingDefinitions,
} from "@/src/features/settings";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { settings, loading, error, updateSetting, savingKey, refetch } =
    useSettingsData();
  const [pickerVisible, setPickerVisible] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHapticFeedback();
  const styles = createStyles(theme);

  const { SETTING_DEFS } = useSettingDefinitions();
  const { updateSetting: handleUpdateSetting } = useUpdateSetting({
    updateSettingMutation: updateSetting,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.triggerLight();
    try {
      await refetch();
      haptics.triggerSuccess();
    } catch (error) {
      haptics.triggerError();
      console.error("Error refreshing settings:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, haptics]);

  if (loading)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("settings.title") || "Settings",
          })}
        />
        <LoadingState message={t("settings.loading")} />
      </>
    );

  if (error)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("settings.title") || "Settings",
          })}
        />
        <ErrorState error={error} onRetry={refetch} />
      </>
    );

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("settings.title") || "Settings",
          headerLeft: () => (
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)/more");
                }
              }}
              style={{ paddingLeft: 16 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </Pressable>
          ),
        })}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.button.primary.background}
            colors={[theme.colors.button.primary.background]}
            progressBackgroundColor={theme.colors.background}
          />
        }
      >
        {Object.entries(SETTING_DEFS).map(([key, def]: [string, any]) => {
          const value = settings?.[key];

          if (def.type === "select") {
            return (
              <SettingSection
                key={key}
                title={def.title}
                description={def.description}
              >
                <SettingPicker
                  title={def.title}
                  value={value ?? def.options[0].value}
                  options={def.options}
                  visible={pickerVisible === key}
                  disabled={savingKey === key}
                  onOpen={() => setPickerVisible(key)}
                  onClose={() => setPickerVisible(null)}
                  onSelect={(val) => handleUpdateSetting(key, val)}
                />
              </SettingSection>
            );
          }

          if (def.type === "switch") {
            const checked = def.toBool ? def.toBool(value) : Boolean(value);
            return (
              <SettingSection
                key={key}
                title={def.title}
                description={def.description}
              >
                <SettingSwitch
                  checked={checked}
                  onChange={(next) =>
                    handleUpdateSetting(
                      key,
                      def.fromBool ? def.fromBool(next) : next
                    )
                  }
                  disabled={savingKey === key}
                />
              </SettingSection>
            );
          }

          return null;
        })}
      </ScrollView>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[4],
    gap: theme.spacing[4],
  },
});
