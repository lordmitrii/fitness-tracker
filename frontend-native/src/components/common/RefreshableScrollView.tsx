import React, { useState, useCallback } from "react";
import { ScrollView, ScrollViewProps, RefreshControl } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type RefreshHandler = () => void | Promise<void>;

interface RefreshableScrollViewProps extends Omit<ScrollViewProps, "refreshControl"> {
  /**
   * Handler function to execute when user pulls to refresh
   */
  onRefresh?: RefreshHandler;
  /**
   * Children to render inside the ScrollView
   */
  children?: React.ReactNode;
}

export default function RefreshableScrollView({
  onRefresh,
  children,
  ...scrollViewProps
}: RefreshableScrollViewProps) {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } catch (error) {
      console.error("Pull-to-refresh handler failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      {...scrollViewProps}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.button.primary.background}
          colors={theme.colors.button.primary.background ? [theme.colors.button.primary.background] : undefined}
        />
      }
      scrollEnabled={true}
      bounces={true}
    >
      {children}
    </ScrollView>
  );
}

