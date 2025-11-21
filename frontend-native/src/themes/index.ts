import { lightColors, darkColors, createThemeColors, ThemeColors } from './colors';
import { createTypography, TypographyVariant } from './typography';
import { spacing, borderRadius, layout, shadows, fontSize, lineHeight } from './spacing';
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
  fontSize: typeof fontSize;
  lineHeight: typeof lineHeight;
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
    fontSize,
    lineHeight,
    layout,
    shadows,
    isDark,
  };
};

export { lightColors, darkColors, createThemeColors };
export type { ThemeColors };
export { createTypography };
export type { TypographyVariant };
export { spacing, borderRadius, fontSize, lineHeight, layout, shadows };
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

export const lightTheme = createTheme(false);
export const darkTheme = createTheme(true);

