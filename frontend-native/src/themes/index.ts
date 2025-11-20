import { lightColors, darkColors, createThemeColors, ThemeColors } from './colors';
import { createTypography, TypographyVariant } from './typography';
import { spacing, borderRadius, layout, shadows } from './spacing';
import { createComponentStyles, ButtonVariant } from './components';
import {
  animationDurations,
  easing,
  createShakeAnimation,
  createFadeInAnimation,
  createSlideDownAnimation,
  createSpinAnimation,
} from './animations';
import { createGradients } from './gradients';

export type Theme = {
  colors: ThemeColors;
  typography: ReturnType<typeof createTypography>;
  components: ReturnType<typeof createComponentStyles>;
  gradients: ReturnType<typeof createGradients>;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  layout: typeof layout;
  shadows: typeof shadows;
  isDark: boolean;
};

export const createTheme = (isDark: boolean = false): Theme => {
  const colors = createThemeColors(isDark);
  const typography = createTypography(colors);
  const components = createComponentStyles(colors);
  const gradients = createGradients(isDark);

  return {
    colors,
    typography,
    components,
    gradients,
    spacing,
    borderRadius,
    layout,
    shadows,
    isDark,
  };
};

// Export individual theme modules
export { lightColors, darkColors, createThemeColors };
export type { ThemeColors };
export { createTypography };
export type { TypographyVariant };
export { spacing, borderRadius, layout, shadows };
export { createComponentStyles };
export type { ButtonVariant };
export {
  animationDurations,
  easing,
  createShakeAnimation,
  createFadeInAnimation,
  createSlideDownAnimation,
  createSpinAnimation,
};
export { createGradients };

// Export default themes
export const lightTheme = createTheme(false);
export const darkTheme = createTheme(true);

