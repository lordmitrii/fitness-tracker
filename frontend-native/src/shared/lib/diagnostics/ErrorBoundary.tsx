import React, { Component, ReactNode, ErrorInfo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation, Trans } from "react-i18next";
import { copyText } from "@/src/shared/utils/navigation";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
  copied: boolean;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, showDetails: false, copied: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  reload = () => {
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      this.setState({ hasError: false, error: null, showDetails: false });
    }
  };

  copy = async () => {
    const { error } = this.state;
    const payload = JSON.stringify(
      {
        message: String(error),
        stack: error?.stack ?? null,
        platform: "react-native",
      },
      null,
      2
    );

    const success = await copyText(payload);
    if (success) {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1500);
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <ErrorBoundaryContent {...this.state} onReload={this.reload} onCopy={this.copy} onToggleDetails={() => this.setState((s) => ({ showDetails: !s.showDetails }))} />;
  }
}

interface ErrorBoundaryContentProps {
  error: Error | null;
  showDetails: boolean;
  copied: boolean;
  onReload: () => void;
  onCopy: () => void;
  onToggleDetails: () => void;
}

function ErrorBoundaryContent({ error, showDetails, copied, onReload, onCopy, onToggleDetails }: ErrorBoundaryContentProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const colors = theme?.colors ?? {};
  const cardColors = colors.card ?? {};
  const textColors = colors.text ?? {};
  const buttonColors = colors.button ?? {};
  const errorColors = colors.status?.error ?? {};

  const backgroundColor = colors.background ?? "#ffffff";
  const cardBg = cardColors.background ?? "#ffffff";
  const borderColor = colors.border ?? "#e5e7eb";
  const textPrimary = textColors.primary ?? "#111827";
  const textSecondary = textColors.secondary ?? "#6b7280";

  const errorBg = errorColors.background ?? "#fee2e2";
  const errorText = errorColors.text ?? "#dc2626";
  const secondaryButtonBg = buttonColors.secondary?.background ?? cardBg;
  const secondaryButtonText = buttonColors.secondary?.text ?? textPrimary;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: errorBg }]}>
            <MaterialIcons name="error-outline" size={40} color={errorText} />
          </View>
        </View>

        <Text style={[styles.title, { color: errorText }]}>
          <Trans i18nKey="error_state.oops_message" />
        </Text>
        <Text style={[styles.description, { color: textSecondary }]}>
          <Trans i18nKey="error_state.description" />
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable style={[styles.button, styles.dangerButton, { backgroundColor: errorBg }]} onPress={onReload}>
            <Text style={[styles.buttonText, { color: errorText }]}>
              <Trans i18nKey="error_state.reload" />
            </Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondaryButton, { backgroundColor: secondaryButtonBg, borderColor }]} onPress={onCopy}>
            <Text style={[styles.buttonText, { color: secondaryButtonText }]}>
              {copied ? (
                <Trans i18nKey="error_state.copied_success" />
              ) : (
                <Trans i18nKey="error_state.copy_report" />
              )}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={onToggleDetails} style={styles.detailsToggle}>
          <Text style={[styles.detailsToggleText, { color: textSecondary }]}>
            {showDetails ? (
              <Trans i18nKey="error_state.hide_details" />
            ) : (
              <Trans i18nKey="error_state.show_details" />
            )}
          </Text>
        </Pressable>

        {showDetails && (
          <ScrollView style={[styles.detailsContainer, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.detailsText, { color: textPrimary }]}>{String(error?.stack || error)}</Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    maxWidth: "100%",
    width: "100%",
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButton: {},
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  detailsToggle: {
    marginTop: 16,
    alignSelf: "flex-end",
  },
  detailsToggleText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
  detailsContainer: {
    marginTop: 16,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    maxHeight: 240,
    width: "100%",
  },
  detailsText: {
    fontSize: 11,
    fontFamily: "monospace",
  },
});

export class ErrorBoundary extends ErrorBoundaryClass {}
