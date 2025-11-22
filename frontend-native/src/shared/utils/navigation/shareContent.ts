import { Platform, Share, Alert } from "react-native";

export async function shareText(
  message: string,
  title?: string
): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        return true;
      }
      return false;
    }

    const result = await Share.share({
      message,
      title,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error sharing text:", error);
    return false;
  }
}

export async function shareFile(
  uri: string,
  options?: {
    title?: string;
    message?: string;
  }
): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      Alert.alert("Sharing", "File sharing is not supported on web");
      return false;
    }

    const result = await Share.share({
      url: uri,
      title: options?.title,
      message: options?.message,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error sharing file:", error);
    return false;
  }
}

export async function shareWorkoutPlan(planData: {
  name: string;
  workouts?: any[];
  [key: string]: any;
}): Promise<boolean> {
  const jsonString = JSON.stringify(planData, null, 2);
  const message = `Workout Plan: ${planData.name}\n\n${jsonString}`;
  return shareText(message, `Share ${planData.name}`);
}

export async function shareStats(statsData: {
  bestPerformances?: any[];
  [key: string]: any;
}): Promise<boolean> {
  const jsonString = JSON.stringify(statsData, null, 2);
  const message = `Fitness Stats\n\n${jsonString}`;
  return shareText(message, "Share Stats");
}

