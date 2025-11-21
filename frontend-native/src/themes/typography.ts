import { TextStyle } from 'react-native';
import { ThemeColors } from './colors';

export type TypographyVariant =
  | 'title'
  | 'titleBlueGradient'
  | 'titleRedGradient'
  | 'body'
  | 'bodyBlue'
  | 'bodyRed'
  | 'caption'
  | 'captionBlue'
  | 'captionRed'
  | 'captionGreen';

export const createTypography = (colors: ThemeColors): Record<TypographyVariant, TextStyle> => {
  return {
    title: {
      fontSize: 24, // text-2xl on mobile, text-4xl on desktop (we use mobile size)
      fontWeight: '400',
      color: colors.text.primary,
      lineHeight: 32,
    },
    titleBlueGradient: {
      fontSize: 24,
      fontWeight: '400',
      // TODO: This is a fallback color, use LinearGradient for actual gradient
      color: colors.button.primary.background,
      lineHeight: 32,
    },
    titleRedGradient: {
      fontSize: 24,
      fontWeight: '400',
      // TODO: This is a fallback color, use LinearGradient for actual gradient
      color: colors.button.danger.background,
      lineHeight: 32,
    },
    body: {
      fontSize: 18, // text-lg
      fontWeight: '400',
      color: colors.text.secondary,
      lineHeight: 28,
    },
    bodyBlue: {
      fontSize: 18,
      fontWeight: '400',
      color: colors.button.primary.background,
      lineHeight: 28,
    },
    bodyRed: {
      fontSize: 18,
      fontWeight: '400',
      color: colors.button.danger.background,
      lineHeight: 28,
    },
    caption: {
      fontSize: 14, // text-sm
      fontWeight: '400',
      color: colors.text.tertiary,
      lineHeight: 20,
    },
    captionBlue: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.button.primary.background,
      lineHeight: 20,
    },
    captionRed: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.button.danger.background,
      lineHeight: 20,
    },
    captionGreen: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.button.success.background,
      lineHeight: 20,
    },
  };
};

// Font family constants
export const fontFamily = {
  system: '-apple-system, Arial, sans-serif', // React Native will use system font
  default: 'System', // React Native system font
};

