import { useMemo, useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Modal, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import PullToRefresh from "@/src/components/common/PullToRefresh";
import useSettingsData from "@/src/hooks/data/useSettingsData";

function SettingSwitch({
  checked,
  onChange,
  disabled = false,
  theme,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  theme: any;
}) {
  return (
    <Switch
      value={checked}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{
        false: theme.colors.border,
        true: theme.colors.button.primary.background,
      }}
      thumbColor={theme.colors.card.background}
    />
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { settings, loading, error, updateSetting, savingKey, refetch } =
    useSettingsData();
  const [pickerVisible, setPickerVisible] = useState<string | null>(null);
  const styles = createStyles(theme);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const SETTING_DEFS = useMemo(
    () => ({
      unit_system: {
        type: "select",
        title: t("settings.unit_system.title"),
        description: t("settings.unit_system.hint"),
        options: [
          { value: "metric", label: t("settings.unit_system.metric") },
          { value: "imperial", label: t("settings.unit_system.imperial") },
        ],
      },
      beta_opt_in: {
        type: "switch",
        title: t("settings.beta_opt_in.title"),
        description: t("settings.beta_opt_in.hint"),
        toBool: (v: any) => Boolean(v),
        fromBool: (b: boolean) => Boolean(b),
      },
      email_notifications: {
        type: "switch",
        title: t("settings.email_notifications.title"),
        description: t("settings.email_notifications.hint"),
        toBool: (v: any) => Boolean(v),
        fromBool: (b: boolean) => Boolean(b),
      },
      calculate_calories: {
        type: "switch",
        title: t("settings.calculate_calories.title"),
        description: t("settings.calculate_calories.hint"),
        toBool: (v: any) => Boolean(v),
        fromBool: (b: boolean) => Boolean(b),
      },
    }),
    [t]
  );

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
      <PullToRefresh onRefresh={handleRefresh}>
        <ScrollView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.content}
        >
          {Object.entries(SETTING_DEFS).map(([key, def]: [string, any]) => {
            const value = settings?.[key];

            if (def.type === "select") {
              return (
                <View
                  key={key}
                  style={[
                    styles.settingCard,
                    {
                      backgroundColor: theme.colors.card.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                      {def.title}
                    </Text>
                    {def.description && (
                      <Text
                        style={[styles.settingDescription, { color: theme.colors.text.secondary }]}
                      >
                        {def.description}
                      </Text>
                    )}
                    <Pressable
                      style={[
                        styles.selectButton,
                        {
                          backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => setPickerVisible(key)}
                      disabled={savingKey === key}
                    >
                      <Text style={[styles.selectButtonText, { color: theme.colors.text.primary }]}>
                        {def.options.find((opt: { value: string }) => opt.value === (value ?? def.options[0].value))?.label || def.options[0].label}
                      </Text>
                      <MaterialIcons
                        name="arrow-drop-down"
                        size={24}
                        color={theme.colors.text.secondary}
                      />
                    </Pressable>
                    <Modal
                      visible={pickerVisible === key}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setPickerVisible(null)}
                    >
                      <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setPickerVisible(null)}
                      >
                        <View
                          style={[
                            styles.modalContent,
                            {
                              backgroundColor: theme.colors.card.background,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                            {def.title}
                          </Text>
                          {def.options.map((opt: { value: string; label: string }) => (
                            <Pressable
                              key={opt.value}
                              style={[
                                styles.modalOption,
                                {
                                  backgroundColor:
                                    (value ?? def.options[0].value) === opt.value
                                      ? theme.colors.button.primary.background
                                      : "transparent",
                                },
                              ]}
                              onPress={() => {
                                updateSetting(key, opt.value);
                                setPickerVisible(null);
                              }}
                            >
                              <Text
                                style={[
                                  styles.modalOptionText,
                                  {
                                    color:
                                      (value ?? def.options[0].value) === opt.value
                                        ? theme.colors.button.primary.text
                                        : theme.colors.text.primary,
                                    fontWeight:
                                      (value ?? def.options[0].value) === opt.value
                                        ? "600"
                                        : "400",
                                  },
                                ]}
                              >
                                {opt.label}
                              </Text>
                              {(value ?? def.options[0].value) === opt.value && (
                                <MaterialIcons
                                  name="check"
                                  size={20}
                                  color={theme.colors.button.primary.text}
                                />
                              )}
                            </Pressable>
                          ))}
                        </View>
                      </Pressable>
                    </Modal>
                  </View>
                </View>
              );
            }

            if (def.type === "switch") {
              const checked = def.toBool ? def.toBool(value) : Boolean(value);
              return (
                <View
                  key={key}
                  style={[
                    styles.settingCard,
                    {
                      backgroundColor: theme.colors.card.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                      {def.title}
                    </Text>
                    {def.description && (
                      <Text
                        style={[styles.settingDescription, { color: theme.colors.text.secondary }]}
                      >
                        {def.description}
                      </Text>
                    )}
                    <View style={styles.switchContainer}>
                      <SettingSwitch
                        checked={checked}
                        onChange={(next) =>
                          updateSetting(
                            key,
                            def.fromBool ? def.fromBool(next) : next
                          )
                        }
                        disabled={savingKey === key}
                        theme={theme}
                      />
                    </View>
                  </View>
                </View>
              );
            }

            return null;
          })}
        </ScrollView>
      </PullToRefresh>
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
  settingCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[5],
    borderWidth: 1,
  },
  settingContent: {
    gap: theme.spacing[2],
  },
  settingTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing[3],
    marginTop: theme.spacing[2],
    minHeight: 44,
  },
  selectButtonText: {
    fontSize: theme.fontSize.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: theme.spacing[5],
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "bold",
    marginBottom: theme.spacing[4],
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[2],
  },
  modalOptionText: {
    fontSize: theme.fontSize.md,
  },
  switchContainer: {
    marginTop: theme.spacing[2],
    alignSelf: "flex-start",
  },
});
