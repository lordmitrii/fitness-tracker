import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/src/context/AuthContext";
import { logStore, type LogEntry } from "./LogStore";

interface LogPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export default function LogPanel({
  visible = true,
  onClose,
}: LogPanelProps): ReactNode | null {
  const { t } = useTranslation();
  const { hasAnyRole } = useAuth();
  const insets = useSafeAreaInsets();

  const allowed = useMemo(
    () => (hasAnyRole ? hasAnyRole(["tester", "admin"]) : false),
    [hasAnyRole]
  );

  useEffect(() => {
    if (!allowed && visible) {
      onClose?.();
    }
  }, [allowed, visible, onClose]);

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsubscribe = logStore.subscribe(() => forceUpdate((tick) => tick + 1));
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const logs = logStore.list();

  const buildLogsText = useCallback(() => {
    return JSON.stringify(
      {
        platform: "react-native",
        logs,
      },
      null,
      2
    );
  }, [logs]);

  const shareLogs = useCallback(async () => {
    try {
      await Share.share({
        title: t("general.diagnostics", "Diagnostics"),
        message: buildLogsText(),
      });
    } catch (error) {
      console.warn("Failed to share logs", error);
    }
  }, [buildLogsText, t]);

  if (!visible || !allowed) {
    return null;
  }

  const levelColor = (level?: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return styles.levelError;
      case "warn":
        return styles.levelWarn;
      case "info":
        return styles.levelInfo;
      default:
        return styles.levelDefault;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            { paddingBottom: insets.bottom ? insets.bottom + 12 : 16 },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("general.diagnostics", "Diagnostics")}
            </Text>
            <View style={styles.actions}>
              <PanelButton
                label={t("general.clear", "Clear")}
                onPress={() => logStore.clear()}
              />
              <PanelButton
                label={t("general.share", "Share")}
                onPress={shareLogs}
              />
              <PanelButton
                label={t("general.close", "Close")}
                onPress={onClose}
              />
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            {logs.map((entry, index) => (
              <View key={`${entry.ts}-${index}`} style={styles.logRow}>
                <Text style={styles.timestamp}>
                  {new Date(entry.ts || Date.now()).toLocaleTimeString()}
                </Text>
                <Text style={[styles.level, levelColor(entry.level)]}>
                  [{String(entry.level || "").toUpperCase()}]
                </Text>
                <Text style={styles.message}>{entry.msg}</Text>
                {entry.meta ? (
                  <Text style={styles.meta}>
                    {JSON.stringify(entry.meta, null, 2)}
                  </Text>
                ) : null}
              </View>
            ))}
            {!logs.length && (
              <Text style={styles.empty}>
                {t("general.no_data", "No diagnostics yet")}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const PanelButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) => (
  <Pressable onPress={onPress} style={styles.button}>
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    marginLeft: "auto",
    flexDirection: "row",
    columnGap: 8,
    rowGap: 4,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonText: {
    fontSize: 14,
    color: "#2563eb",
  },
  scroll: {
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  logRow: {
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 12,
    color: "#6b7280",
  },
  level: {
    fontWeight: "700",
    marginRight: 8,
  },
  levelError: {
    color: "#dc2626",
  },
  levelWarn: {
    color: "#d97706",
  },
  levelInfo: {
    color: "#2563eb",
  },
  levelDefault: {
    color: "#4b5563",
  },
  message: {
    fontSize: 13,
    fontFamily: "monospace",
  },
  meta: {
    marginTop: 4,
    fontFamily: "monospace",
    fontSize: 12,
    color: "#374151",
  },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 32,
  },
});

