import { Stack } from "expo-router";
import { AuthProvider } from "@/src/context/AuthContext";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { waitForI18n } from "@/src/i18n";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { ErrorBoundary } from "@/src/diagnostics/ErrorBoundary";
import { useCallback, useState, useEffect, type ReactNode } from "react";
import { View, ActivityIndicator } from "react-native";
import TouchHotspot from "@/src/components/TouchHotspot";
import LogPanel from "@/src/diagnostics/LogPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
});

function RootLayoutContent() {
  const { theme } = useTheme();
  const [showLogs, setShowLogs] = useState(false);
  const openLogs = useCallback(() => setShowLogs(true), []);
  const closeLogs = useCallback(() => setShowLogs(false), []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
          }}
        >
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
          <TouchHotspot tapsNeeded={5} onOpen={openLogs} />
          {showLogs && <LogPanel onClose={closeLogs} />}
        </SafeAreaView>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function I18nInitializer({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    waitForI18n()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("Failed to initialize i18n:", err);
        setError(err);
        setIsReady(true);
      });
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nInitializer>
          <RootLayoutContent />
        </I18nInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
