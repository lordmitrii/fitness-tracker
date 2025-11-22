import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { ThemedText } from "@/src/shared/ui/ThemedText";

interface GlobalLoadingStateProps {
  blocking?: boolean;
}

const HARDCAP_TIMEOUT = 6000;
const STORAGE_KEY = "hasLoaded";

export default function GlobalLoadingState({
  blocking,
}: GlobalLoadingStateProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const checkHasLoaded = async () => {
      try {
        const hasLoaded = await AsyncStorage.getItem(STORAGE_KEY);
        if (hasLoaded === "1") {
          setAppLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to check hasLoaded:", error);
      }
    };

    checkHasLoaded();
  }, []);

  useEffect(() => {
    const failsafe = setTimeout(async () => {
      setAppLoading(false);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, "1");
      } catch (error) {
        console.error("Failed to save hasLoaded:", error);
      }
      console.log("[globalLoading] failsafe timeout");
    }, HARDCAP_TIMEOUT);
    return () => clearTimeout(failsafe);
  }, []);

  useEffect(() => {
    console.log("[globalLoading] blocking/appLoading change", {
      blocking,
      appLoading,
    });
    
    if (blocking === undefined) {
      if (!appLoading) return;
      const timeout = setTimeout(async () => {
        setAppLoading(false);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, "1");
        } catch (error) {
          console.error("Failed to save hasLoaded:", error);
        }
      }, 1500);
      return () => clearTimeout(timeout);
    } else {
      if (!blocking) {
        setAppLoading(false);
        AsyncStorage.setItem(STORAGE_KEY, "1").catch((error) => {
          console.error("Failed to save hasLoaded:", error);
        });
      }
    }
  }, [blocking, appLoading]);

  if (!appLoading) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ThemedText
        variant="title"
        style={[
          styles.welcomeText,
          {
            color: theme.colors.button.primary.background,
          },
        ]}
      >
        {t("global_loading.welcome")}
      </ThemedText>
      <ActivityIndicator
        size="large"
        color={theme.colors.button.primary.background}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginHorizontal: 40,
  },
  spinner: {
    marginTop: 20,
  },
});

