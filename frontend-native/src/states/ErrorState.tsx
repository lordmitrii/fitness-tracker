import { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { copyText } from "@/src/utils/copyText";
import { ThemedView } from "@/src/components/themed-view";
import { ThemedText } from "@/src/components/themed-text";

interface ErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
}

const pickMessage = (error: unknown, t: (key: string) => string): string => {
  if (!error) return t("error_state.unknown_error");
  if (typeof error === "string") return error;
  
  const err = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
      status?: number;
    };
    message?: string;
    isAxiosError?: boolean;
    config?: { url?: string; method?: string };
    stack?: string;
  };

  return (
    err?.response?.data?.message ??
    (typeof err?.response?.data?.error === "string"
      ? err.response.data.error
      : null) ??
    err?.message ??
    (typeof err?.response?.data === "string" ? err.response.data : null) ??
    t("error_state.unknown_error")
  );
};

const buildDetails = (error: unknown) => {
  try {
    if (!error || typeof error === "string") return null;

    const err = error as {
      isAxiosError?: boolean;
      config?: { url?: string; method?: string };
      response?: { status?: number; data?: unknown };
      message?: string;
      stack?: string;
      name?: string;
    };

    const isAxios = !!err.isAxiosError || !!err.config || !!err.response;
    if (isAxios) {
      return {
        type: "AxiosError",
        message: err.message,
        url: err.config?.url,
        method: err.config?.method,
        status: err.response?.status,
        data: err.response?.data,
        stack: err.stack ?? null,
      };
    }

    if (err instanceof Error || err?.message || err?.stack) {
      return {
        type: err.name || "Error",
        message: err.message,
        stack: err.stack ?? null,
      };
    }

    return { type: typeof error, value: error };
  } catch {
    return null;
  }
};

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const message = useMemo(() => pickMessage(error, t), [error, t]);
  const details = useMemo(() => buildDetails(error), [error]);

  const isUnknown = message === t("error_state.unknown_error") && !details;

  const handleCopy = async () => {
    const payload = JSON.stringify(
      {
        message: String(message),
        details,
        platform: "react-native",
      },
      null,
      2
    );

    const success = await copyText(payload);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <ThemedView variant="card" style={styles.container}>
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: theme.colors.status.error.background },
          ]}
        >
          <MaterialIcons
            name="error-outline"
            size={48}
            color={theme.colors.status.error.text}
          />
        </View>
      </View>

      <ThemedText
        variant="title"
        style={[
          styles.title,
          { color: theme.colors.status.error.text },
        ]}
      >
        {t("error_state.oops_message")}
      </ThemedText>

      <ThemedText variant="body" style={styles.message}>
        {message}
      </ThemedText>

      <View style={styles.buttonContainer}>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            style={[styles.button, theme.components.buttonDanger]}
          >
            <Text style={[styles.buttonText, theme.components.buttonDangerText]}>
              {t("error_state.try_again")}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleCopy}
          style={[styles.button, theme.components.buttonSecondary]}
        >
          <Text
            style={[styles.buttonText, theme.components.buttonSecondaryText]}
          >
            {copied
              ? t("error_state.copied_success")
              : t("error_state.copy_report")}
          </Text>
        </Pressable>

        {!isUnknown && details && (
          <Pressable
            onPress={() => setOpen((v) => !v)}
            style={styles.detailsButton}
          >
            <ThemedText variant="body" style={styles.detailsButtonText}>
              {open
                ? t("error_state.hide_details")
                : t("error_state.show_details")}
            </ThemedText>
          </Pressable>
        )}
      </View>

      {open && details && (
        <ScrollView
          style={[
            styles.detailsContainer,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.detailsText, { color: theme.colors.text.primary }]}>
            {JSON.stringify(details, null, 2)}
          </Text>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    marginBottom: 16,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  detailsButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
  },
  detailsButtonText: {
    textDecorationLine: "underline",
    fontSize: 14,
  },
  detailsContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
  },
  detailsText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
});

