import { ViewStyle, TextStyle } from "react-native";
import { ThemeColors } from "./colors";
import { spacing, borderRadius, shadows } from "./spacing";

export type ButtonVariant =
  | "primary"
  | "primaryInverted"
  | "primaryLight"
  | "secondary"
  | "secondaryLight"
  | "danger"
  | "dangerLight"
  | "warning"
  | "success"
  | "successLight";

export const createComponentStyles = (colors: ThemeColors) => {
  const baseButton: ViewStyle = {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  };

  const baseButtonText: TextStyle = {
    fontWeight: "600",
    fontSize: 16,
  };

  return {
    // Card styles
    card: {
      backgroundColor: colors.card.background,
      borderRadius: borderRadius["2xl"],
      padding: spacing[8],
      margin: spacing[4],
      ...shadows.lg,
    } as ViewStyle,

    // Input styles
    input: {
      width: "100%",
      borderWidth: 1,
      borderColor: colors.input.border,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      backgroundColor: colors.input.background,
      color: colors.input.text,
      fontSize: 16,
    } as ViewStyle & TextStyle,

    inputPlaceholder: {
      color: colors.input.placeholder,
    } as TextStyle,

    // Button styles
    button: {
      ...baseButton,
    } as ViewStyle,

    buttonText: {
      ...baseButtonText,
    } as TextStyle,

    // Primary button
    buttonPrimary: {
      ...baseButton,
      backgroundColor: colors.button.primary.background,
    } as ViewStyle,

    buttonPrimaryText: {
      ...baseButtonText,
      color: colors.button.primary.text,
    } as TextStyle,

    // Primary inverted (gradient reversed)
    buttonPrimaryInverted: {
      ...baseButton,
      backgroundColor: colors.button.primary.background,
    } as ViewStyle,

    buttonPrimaryInvertedText: {
      ...baseButtonText,
      color: colors.button.primary.text,
    } as TextStyle,

    // Primary light (outlined)
    buttonPrimaryLight: {
      ...baseButton,
      backgroundColor: colors.card.background,
      borderWidth: 2,
      borderColor: colors.button.primary.background,
    } as ViewStyle,

    buttonPrimaryLightText: {
      ...baseButtonText,
      color: colors.button.primary.background,
    } as TextStyle,

    // Secondary button
    buttonSecondary: {
      ...baseButton,
      backgroundColor: colors.button.secondary.background,
    } as ViewStyle,

    buttonSecondaryText: {
      ...baseButtonText,
      color: colors.button.secondary.text,
    } as TextStyle,

    // Secondary light
    buttonSecondaryLight: {
      ...baseButton,
      backgroundColor: colors.card.background,
      borderWidth: 2,
      borderColor: colors.button.secondary.background,
    } as ViewStyle,

    buttonSecondaryLightText: {
      ...baseButtonText,
      color: colors.button.secondary.background,
    } as TextStyle,

    // Danger button
    buttonDanger: {
      ...baseButton,
      backgroundColor: colors.button.danger.background,
    } as ViewStyle,

    buttonDangerText: {
      ...baseButtonText,
      color: colors.button.danger.text,
    } as TextStyle,

    // Danger light
    buttonDangerLight: {
      ...baseButton,
      backgroundColor: colors.card.background,
      borderWidth: 2,
      borderColor: colors.button.danger.background,
    } as ViewStyle,

    buttonDangerLightText: {
      ...baseButtonText,
      color: colors.button.danger.background,
    } as TextStyle,

    // Warning button
    buttonWarning: {
      ...baseButton,
      backgroundColor: colors.button.warning.background,
    } as ViewStyle,

    buttonWarningText: {
      ...baseButtonText,
      color: colors.button.warning.text,
    } as TextStyle,

    // Success button
    buttonSuccess: {
      ...baseButton,
      backgroundColor: colors.button.success.background,
    } as ViewStyle,

    buttonSuccessText: {
      ...baseButtonText,
      color: colors.button.success.text,
    } as TextStyle,

    // Success light
    buttonSuccessLight: {
      ...baseButton,
      backgroundColor: colors.card.background,
      borderWidth: 2,
      borderColor: colors.button.success.background,
    } as ViewStyle,

    buttonSuccessLightText: {
      ...baseButtonText,
      color: colors.button.success.background,
    } as TextStyle,

    // Container styles
    containerError: {
      backgroundColor: colors.status.error.background,
      borderWidth: 1,
      borderColor: colors.status.error.border,
      borderRadius: borderRadius.md,
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
      marginBottom: spacing[2],
      alignItems: "center",
    } as ViewStyle,

    containerErrorText: {
      color: colors.status.error.text,
      fontSize: 14,
    } as TextStyle,

    containerSuccess: {
      backgroundColor: colors.status.success.background,
      borderWidth: 1,
      borderColor: colors.status.success.border,
      borderRadius: borderRadius.md,
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
      marginBottom: spacing[2],
      alignItems: "center",
    } as ViewStyle,

    containerSuccessText: {
      color: colors.status.success.text,
      fontSize: 14,
    } as TextStyle,
  };
};
