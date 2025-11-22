import { Alert, Platform, ActionSheetIOS } from "react-native";

export const nativeAlerts = {
  confirm: (
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  ) => {
    const {
      confirmText = "OK",
      cancelText = "Cancel",
      onConfirm,
      onCancel,
    } = options || {};

    Alert.alert(title, message, [
      {
        text: cancelText,
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: "destructive",
        onPress: onConfirm,
      },
    ]);
  },

  error: (title: string, message: string, onPress?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", onPress }]);
  },

  success: (title: string, message: string, onPress?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", onPress }]);
  },

  info: (title: string, message: string, onPress?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", onPress }]);
  },
};

export const showActionSheet = (
  options: string[],
  callback: (index: number) => void,
  destructiveIndex?: number
) => {
  if (Platform.OS === "ios" && ActionSheetIOS) {
    const cancelIndex = options.length - 1;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: cancelIndex,
        destructiveButtonIndex: destructiveIndex,
      },
      callback
    );
  } else {
    // Fallback to Alert on Android
    const buttons = options.map((option, index) => ({
      text: option,
      onPress: () => callback(index),
      style: index === destructiveIndex ? ("destructive" as const) : ("default" as const),
    }));
    Alert.alert("Select an option", "", buttons);
  }
};

