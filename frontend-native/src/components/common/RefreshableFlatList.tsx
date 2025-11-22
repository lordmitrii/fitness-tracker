import React, { useState, useCallback } from "react";
import { FlatList, FlatListProps, RefreshControl } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

type RefreshHandler = () => void | Promise<void>;

interface RefreshableFlatListProps<ItemT> extends Omit<FlatListProps<ItemT>, "refreshControl"> {
  onRefresh?: RefreshHandler;
}

export default function RefreshableFlatList<ItemT = any>({
  onRefresh,
  ...flatListProps
}: RefreshableFlatListProps<ItemT>) {
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
    <FlatList
      {...flatListProps}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.button.primary.background}
          colors={theme.colors.button.primary.background ? [theme.colors.button.primary.background] : undefined}
        />
      }
    />
  );
}

