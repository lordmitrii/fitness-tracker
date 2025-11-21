import { useState, useCallback, useEffect, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { useHapticFeedback } from "@/src/hooks/useHapticFeedback";
import { PROFILE_LIMITS } from "@/src/constants/fitness";
import {
  toDisplayHeight,
  toDisplayWeight,
  fromDisplayHeight,
  fromDisplayWeight,
  displayHeightMax,
  displayHeightMin,
  displayWeightMax,
  displayWeightMin,
  INTEGER_INPUT_RE,
  DECIMAL_INPUT_RE,
  toNumOrNull,
} from "@/src/utils/numberUtils";

interface ProfileFormProps {
  initialData?: {
    age?: number;
    weight?: number;
    height?: number;
  };
  onSubmit: (data: { age: number; weight: number; height: number; sex: string }) => void;
  label: string;
  submitLabel: string;
  submitting?: boolean;
  unitSystem?: "metric" | "imperial";
}

const ProfileForm = memo(function ProfileForm({
  initialData,
  onSubmit,
  label,
  submitLabel,
  submitting = false,
  unitSystem = "metric",
}: ProfileFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const haptics = useHapticFeedback();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(
    initialData || {
      age: "",
      weight: "",
      height: "",
      sex: "",
    }
  );

  const validateField = useCallback(
    (name: string, value: string | number) => {
      switch (name) {
        case "age":
          if (value === "" || !Number.isInteger(value))
            return t("profile_form.age_must_be_number");
          if (Number(value) < PROFILE_LIMITS.age.min || Number(value) > PROFILE_LIMITS.age.max)
            return t("profile_form.age_out_of_range", {
              min: PROFILE_LIMITS.age.min,
              max: PROFILE_LIMITS.age.max,
            });
          return;
        case "weight":
          if (value === "" || !Number.isFinite(value))
            return t("profile_form.weight_must_be_number");
          if (
            Number(value) < PROFILE_LIMITS.weight.min ||
            Number(value) > PROFILE_LIMITS.weight.max
          )
            return t("profile_form.weight_out_of_range", {
              min: displayWeightMin(PROFILE_LIMITS.weight.min, unitSystem),
              max: displayWeightMax(PROFILE_LIMITS.weight.max, unitSystem),
              unit:
                unitSystem === "metric"
                  ? t("measurements.weight.kg")
                  : t("measurements.weight.lbs_of"),
            });
          return;
        case "height":
          if (value === "" || !Number.isFinite(value))
            return t("profile_form.height_must_be_number");
          if (
            Number(value) < PROFILE_LIMITS.height.min ||
            Number(value) > PROFILE_LIMITS.height.max
          )
            return t("profile_form.height_out_of_range", {
              min: displayHeightMin(PROFILE_LIMITS.height.min, unitSystem),
              max: displayHeightMax(PROFILE_LIMITS.height.max, unitSystem),
              unit:
                unitSystem === "metric"
                  ? t("measurements.height.cm")
                  : t("measurements.height.ft_of"),
            });
          return;
        case "sex":
          if (!["male", "female"].includes(value as string))
            return t("profile_form.sex_required");
          return;
      }
    },
    [t, unitSystem]
  );

  const [ageDraft, setAgeDraft] = useState(() =>
    (initialData?.age ?? "").toString()
  );
  const [weightDraft, setWeightDraft] = useState(() =>
    (toDisplayWeight(initialData?.weight, unitSystem) ?? "").toString()
  );
  const [heightDraft, setHeightDraft] = useState(() =>
    (toDisplayHeight(initialData?.height, unitSystem) ?? "").toString()
  );
  const [sexDraft, setSexDraft] = useState(() => (initialData as any)?.sex ?? "");

  useEffect(() => {
    setAgeDraft((formData.age ?? "").toString());
  }, [formData.age]);

  useEffect(() => {
    setWeightDraft(
      (toDisplayWeight(formData.weight as number, unitSystem) ?? "").toString()
    );
  }, [formData.weight, unitSystem]);

  useEffect(() => {
    setHeightDraft(
      (toDisplayHeight(formData.height as number, unitSystem) ?? "").toString()
    );
  }, [formData.height, unitSystem]);

  useEffect(() => {
    setSexDraft((formData as any).sex ?? "");
  }, [(formData as any).sex]);

  const commitAge = useCallback(() => {
    const n = toNumOrNull(ageDraft);
    const intVal = n == null ? "" : Math.round(n);
    const err = validateField("age", intVal);
    setFormErrors((p) => ({ ...p, age: err ?? "" }));

    if (!err) {
      setFormData((prev) => ({ ...prev, age: intVal } as typeof prev));
      setAgeDraft((intVal ?? "").toString());
    }
  }, [ageDraft, validateField]);

  const commitWeight = useCallback(() => {
    const n = toNumOrNull(weightDraft);
    const rounded = n == null ? "" : Math.round(n * 10) / 10;
    const base = rounded === "" ? "" : fromDisplayWeight(rounded, unitSystem);

    const clamped =
      base === ""
        ? ""
        : Math.max(
            PROFILE_LIMITS.weight.min,
            Math.min(base, PROFILE_LIMITS.weight.max)
          );

    const err = validateField("weight", clamped);
    setFormErrors((p) => ({ ...p, weight: err ?? "" }));

    if (!err) {
      setFormData((prev) => ({ ...prev, weight: clamped } as typeof prev));
      setWeightDraft((toDisplayWeight(clamped, unitSystem) ?? "").toString());
    }
  }, [weightDraft, unitSystem, validateField]);

  const commitHeight = useCallback(() => {
    const n = toNumOrNull(heightDraft);
    const rounded = n == null ? "" : Math.round(n * 10) / 10;
    const base = rounded === "" ? "" : fromDisplayHeight(rounded, unitSystem);

    const clamped =
      base === ""
        ? ""
        : Math.max(
            PROFILE_LIMITS.height.min,
            Math.min(base, PROFILE_LIMITS.height.max)
          );

    const err = validateField("height", clamped);
    setFormErrors((p) => ({ ...p, height: err ?? "" }));

    if (!err) {
      setFormData((prev) => ({ ...prev, height: clamped } as typeof prev));
      setHeightDraft((toDisplayHeight(clamped, unitSystem) ?? "").toString());
    }
  }, [heightDraft, unitSystem, validateField]);

  const commitSex = useCallback(() => {
    const err = validateField("sex", sexDraft);
    setFormErrors((p) => ({ ...p, sex: err ?? "" }));

    if (!err) {
      setFormData((prev) => ({ ...prev, sex: sexDraft } as typeof prev));
    }
  }, [sexDraft, validateField]);

  const commitAllDrafts = useCallback(() => {
    commitAge();
    commitWeight();
    commitHeight();
    commitSex();
  }, [commitAge, commitWeight, commitHeight, commitSex]);

  const validate = useCallback(() => {
    const ageNum = toNumOrNull(ageDraft);
    const ageInt = ageNum == null ? "" : Math.round(ageNum);

    const wNum = toNumOrNull(weightDraft);
    const wRounded = wNum == null ? "" : Math.round(wNum * 10) / 10;
    const wBase =
      wRounded === "" ? "" : fromDisplayWeight(wRounded, unitSystem);

    const hNum = toNumOrNull(heightDraft);
    const hRounded = hNum == null ? "" : Math.round(hNum * 10) / 10;
    const hBase =
      hRounded === "" ? "" : fromDisplayHeight(hRounded, unitSystem);

    const candidate = {
      age: ageInt,
      weight: wBase,
      height: hBase,
      sex: sexDraft,
    };

    const fields = ["age", "weight", "height", "sex"];
    const errs: Record<string, string> = {};
    for (const name of fields) {
      const err = validateField(name, candidate[name as keyof typeof candidate]);
      if (err) errs[name] = err;
    }
    return { errs, candidate };
  }, [validateField, ageDraft, weightDraft, heightDraft, sexDraft, unitSystem]);

  const handleSubmit = useCallback(() => {
    commitAllDrafts();

    const { errs, candidate } = validate();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      haptics.triggerError();
      return;
    }

    haptics.triggerSuccess();
    onSubmit(candidate as any);
  }, [commitAllDrafts, validate, onSubmit, haptics]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {label}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              {t("profile_form.age_label")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                  borderColor: formErrors.age ? theme.colors.status.error.text : theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
              value={ageDraft}
              onChangeText={(v) => {
                if (!INTEGER_INPUT_RE.test(v)) return;
                setAgeDraft(v);
                if (formErrors.age)
                  setFormErrors((p) => ({ ...p, age: "" }));
              }}
              onBlur={commitAge}
              placeholder={t("profile_form.age_placeholder")}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="number-pad"
              autoComplete="off"
            />
            {formErrors.age && (
              <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                {formErrors.age}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              {t("profile_form.weight_label")} (
              {unitSystem === "metric"
                ? t("measurements.weight.kg")
                : t("measurements.weight.lbs_of")}
              )
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                  borderColor: formErrors.weight ? theme.colors.status.error.text : theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
              value={weightDraft}
              onChangeText={(v) => {
                if (!DECIMAL_INPUT_RE.test(v)) return;
                setWeightDraft(v);
                if (formErrors.weight)
                  setFormErrors((p) => ({ ...p, weight: "" }));
              }}
              onBlur={commitWeight}
              placeholder={`${t("profile_form.weight_placeholder")} ${t(
                unitSystem === "metric"
                  ? "measurements.weight.kg"
                  : "measurements.weight.lbs_of"
              )}`}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="decimal-pad"
              autoComplete="off"
            />
            {formErrors.weight && (
              <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                {formErrors.weight}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              {t("profile_form.height_label")} (
              {unitSystem === "metric"
                ? t("measurements.height.cm")
                : t("measurements.height.ft_of")}
              )
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                  borderColor: formErrors.height ? theme.colors.status.error.text : theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
              value={heightDraft}
              onChangeText={(v) => {
                if (!DECIMAL_INPUT_RE.test(v)) return;
                setHeightDraft(v);
                if (formErrors.height)
                  setFormErrors((p) => ({ ...p, height: "" }));
              }}
              onBlur={commitHeight}
              placeholder={`${t("profile_form.height_placeholder")} ${t(
                unitSystem === "metric"
                  ? "measurements.height.cm"
                  : "measurements.height.ft_of"
              )}`}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="decimal-pad"
              autoComplete="off"
            />
            {formErrors.height && (
              <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                {formErrors.height}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              {t("profile_form.sex_label")}
            </Text>
            <View style={styles.radioContainer}>
              {(["male", "female"] as const).map((key) => (
                <Pressable
                  key={key}
                  style={styles.radioOption}
                  onPress={() => {
                    setSexDraft(key);
                    if (formErrors.sex)
                      setFormErrors((p) => ({ ...p, sex: "" }));
                    commitSex();
                  }}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          sexDraft === key
                            ? theme.colors.button.primary.background
                            : theme.colors.border,
                      },
                    ]}
                  >
                    {sexDraft === key && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.colors.button.primary.background },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: theme.colors.text.primary }]}>
                    {t(`profile_form.sex_${key}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            {formErrors.sex && (
              <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                {formErrors.sex}
              </Text>
            )}
          </View>

          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.button.primary.background,
                opacity: submitting ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
              {submitting ? t("general.saving") : submitLabel}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  radioContainer: {
    flexDirection: "row",
    gap: 24,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileForm;

