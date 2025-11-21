import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { ThemedView } from "@/src/components/themed-view";
import { ThemedText } from "@/src/components/themed-text";
import { SkeletonCard } from "@/src/components/common/SkeletonLoader";

interface LoadingStateProps {
  message?: string;
  subtitle?: string;
  useSkeleton?: boolean;
  skeletonLines?: number;
}

export default function LoadingState({
  message,
  subtitle,
  useSkeleton = false,
  skeletonLines = 3,
}: LoadingStateProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (useSkeleton) {
    return (
      <View style={styles.skeletonContainer}>
        {Array.from({ length: skeletonLines }).map((_, index) => (
          <SkeletonCard key={index} lines={2} showAvatar={index === 0} />
        ))}
      </View>
    );
  }

  return (
    <ThemedView variant="card" style={styles.container}>
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: theme.colors.button.primary.background + "20" },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={theme.colors.button.primary.background}
          />
        </View>
      </View>
      <ThemedText variant="title" style={styles.title}>
        {message || t("general.loading")}
      </ThemedText>
      {subtitle && (
        <ThemedText variant="body" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
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
  subtitle: {
    textAlign: "center",
    marginTop: 4,
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
});

