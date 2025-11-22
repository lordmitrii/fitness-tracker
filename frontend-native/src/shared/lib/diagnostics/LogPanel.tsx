import { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/src/shared/lib/context/AuthContext";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { logStore, LogEntry } from "./LogStore";
import { copyText } from "@/src/shared/utils/navigation";

interface LogPanelProps {
  onClose: () => void;
}

export default function LogPanel({ onClose }: LogPanelProps) {
  const { t } = useTranslation();
  const { hasAnyRole } = useAuth();
  const { theme } = useTheme();

  const allowed = useMemo(
    () => (hasAnyRole ? hasAnyRole(["tester", "admin"]) : false),
    [hasAnyRole]
  );

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!allowed) {
      onClose?.();
      return;
    }
    const unsubscribe = logStore.subscribe(() => setTick((t) => t + 1));
    return unsubscribe;
  }, [allowed, onClose]);

  useEffect(() => {
    if (!allowed) onClose?.();
  }, [allowed, onClose]);

  if (!allowed) return null;

  const logs = logStore.list();

  const levelColor = (level?: string) => {
    switch (level) {
      case "error":
        return theme.colors.status.error.text;
      case "warn":
        return theme.colors.button.warning.text;
      case "info":
        return theme.colors.button.primary.background;
      default:
        return theme.colors.text.tertiary;
    }
  };

  const buildLogsText = () =>
    JSON.stringify({ platform: "react-native", logs: logStore.list() }, null, 2);

  const download = async () => {
    try {
      const text = buildLogsText();
      await copyText(text);
    } catch (error) {
      console.error("Failed to copy logs:", error);
    }
  };

  const share = async () => {
    try {
      const text = buildLogsText();
      await copyText(text);
    } catch (error) {
      console.error("Failed to share logs:", error);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card.background,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
        <View
          style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.card.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t("general.diagnostics")}
        </Text>

        <View style={styles.headerActions}>
          <Pressable onPress={() => logStore.clear()} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.colors.text.secondary }]}>
              {t("general.clear")}
            </Text>
          </Pressable>
          <Pressable onPress={download} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.colors.text.secondary }]}>
              {t("general.download")}
            </Text>
          </Pressable>
          <Pressable onPress={share} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.colors.text.secondary }]}>
              {t("general.share")}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.colors.text.secondary }]}>
              {t("general.close")}
            </Text>
          </Pressable>
            </View>
          </View>

      <ScrollView style={styles.logsContainer} contentContainerStyle={styles.logsContent}>
        {logs.map((l: LogEntry, i: number) => (
          <View key={i} style={styles.logEntry}>
            <View style={styles.logHeaderRow}>
              <Text style={[styles.logTime, { color: theme.colors.text.tertiary }]}>
                {new Date(l.ts || Date.now()).toLocaleTimeString()}
              </Text>
              <Text style={[styles.logLevel, { color: levelColor(l.level) }]}>
                [{String(l.level || "").toUpperCase()}]
              </Text>
            </View>
            <Text style={[styles.logMessage, { color: theme.colors.text.primary }]}>
              {typeof l.msg === "string" ? l.msg : JSON.stringify(l.msg)}
            </Text>
            {l.meta && (
              <View style={[styles.logMeta, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
                <Text style={[styles.logMetaText, { color: theme.colors.text.secondary }]}>
                  {JSON.stringify(l.meta, null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: Platform.select({ default: "System", ios: "Menlo", android: "monospace" }),
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  headerButton: {
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
  logsContainer: {
    flex: 1,
  },
  logsContent: {
    padding: 12,
  },
  logEntry: {
    marginBottom: 8,
  },
  logHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  logTime: {
    fontSize: 11,
    fontFamily: Platform.select({ default: "System", ios: "Menlo", android: "monospace" }),
  },
  logLevel: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Platform.select({ default: "System", ios: "Menlo", android: "monospace" }),
  },
  logMessage: {
    fontSize: 11,
    flex: 1,
    fontFamily: Platform.select({ default: "System", ios: "Menlo", android: "monospace" }),
  },
  logMeta: {
    marginTop: 4,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    width: "100%",
  },
  logMetaText: {
    fontSize: 10,
    fontFamily: Platform.select({ default: "System", ios: "Menlo", android: "monospace" }),
  },
});
