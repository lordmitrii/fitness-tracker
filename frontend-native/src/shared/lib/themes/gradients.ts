import { lightColors, darkColors } from './colors';

export type GradientColors = {
  colors: string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export const createGradients = (isDark: boolean) => {
  const colors = isDark ? darkColors : lightColors;

  return {
    // Primary button gradient (from-blue-600 to-blue-500)
    primary: {
      colors: [colors.blue[600], colors.blue[500]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Primary inverted (from-blue-600 to-blue-500, reversed)
    primaryInverted: {
      colors: [colors.blue[500], colors.blue[600]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Danger button gradient (from-pink-600 to-red-500)
    danger: {
      colors: [colors.pink[600], colors.red[500]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Danger light gradient (from-pink-400 to-red-400)
    dangerLight: {
      colors: [colors.pink[400], colors.red[400]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Secondary button gradient (from-gray-600 to-gray-500)
    secondary: {
      colors: [colors.gray[600], colors.gray[500]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Secondary light gradient (from-gray-500 to-gray-400)
    secondaryLight: {
      colors: [colors.gray[500], colors.gray[400]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Warning button gradient (from-yellow-600 to-yellow-500)
    warning: {
      colors: [colors.yellow[600], colors.yellow[500]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Success button gradient (from-green-500 to-green-600)
    success: {
      colors: [colors.green[500], colors.green[600]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Success light gradient (from-green-400 to-green-500)
    successLight: {
      colors: [colors.green[400], colors.green[500]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Title blue gradient (from-blue-600 to-blue-500)
    titleBlue: {
      colors: [colors.blue[600], colors.blue[500]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,

    // Title red gradient (from-pink-400 to-red-400)
    titleRed: {
      colors: [colors.pink[400], colors.red[400]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientColors,
  };
};

