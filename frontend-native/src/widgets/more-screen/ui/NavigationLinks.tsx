import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface NavigationLink {
  to: string;
  label: string;
  isPrimary?: boolean;
  isNew?: boolean;
}

interface NavigationLinksProps {
  links: NavigationLink[];
  onLinkPress: (to: string) => void;
}

export default function NavigationLinks({
  links,
  onLinkPress,
}: NavigationLinksProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.linksContainer}>
      {links.map((link) => (
        <Pressable
          key={link.to}
          style={[
            styles.linkButton,
            link.isPrimary && styles.primaryLinkButton,
            {
              backgroundColor: link.isPrimary
                ? theme.colors.button.primary.background
                : theme.colors.card.background,
              borderColor: link.isPrimary
                ? theme.colors.button.primary.background
                : theme.colors.border,
            },
          ]}
          onPress={() => onLinkPress(link.to)}
        >
          <Text
            style={[
              styles.linkText,
              {
                color: link.isPrimary
                  ? theme.colors.button.primary.text
                  : theme.colors.text.primary,
              },
            ]}
          >
            {link.label}
          </Text>
          {link.isNew && (
            <View
              style={[
                styles.newBadge,
                {
                  backgroundColor: theme.colors.status.success.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.newBadgeText,
                  { color: theme.colors.status.success.text },
                ]}
              >
                NEW
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  linksContainer: {
    gap: theme.spacing[3],
  },
  linkButton: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryLinkButton: {
    borderWidth: 0,
  },
  linkText: {
    fontSize: theme.fontSize.md,
    fontWeight: "500",
  },
  newBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.xl,
  },
  newBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: "700",
  },
});

