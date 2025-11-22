import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { InstallationSteps } from "./InstallationSteps";
import { StoreButton } from "./StoreButton";

interface PlatformSectionProps {
  platform: "ios" | "android";
  steps: string[];
  onStorePress: () => void;
  storeButtonLabel: string;
}

export default function PlatformSection({
  platform,
  steps,
  onStorePress,
  storeButtonLabel,
}: PlatformSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const platformName = platform === "ios" ? "iOS" : "Android";
  const iconName = platform === "ios" ? "phone-iphone" : "phone-android";

  return (
    <View style={styles.platformSection}>
      <View style={styles.platformHeader}>
        <MaterialIcons name={iconName} size={24} color={theme.colors.text.primary} />
        <Text style={[styles.platformTitle, { color: theme.colors.text.primary }]}>
          {platformName}
        </Text>
      </View>
      <InstallationSteps steps={steps} />
      <StoreButton onPress={onStorePress} label={storeButtonLabel} />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  platformSection: {
    gap: theme.spacing[4],
  },
  platformHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  platformTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: "600",
  },
});

