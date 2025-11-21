import { Text, type TextProps } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import type { TypographyVariant } from '@/src/themes';

export type ThemedTextProps = TextProps & {
  variant?: TypographyVariant | 'default' | 'defaultSemiBold' | 'subtitle' | 'link';
  // Legacy props for backward compatibility
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  variant,
  lightColor,
  darkColor,
  type,
  ...rest
}: ThemedTextProps) {
  const { theme } = useTheme();

  // Support both new variant prop and legacy type prop
  const textVariant = variant || type || 'default';

  // Map legacy types to new variants
  const variantMap: Record<string, TypographyVariant | null> = {
    default: 'body',
    defaultSemiBold: 'body',
    title: 'title',
    subtitle: 'title',
    link: 'bodyBlue',
  };

  const mappedVariant = variantMap[textVariant] || (textVariant as TypographyVariant);

  // Get style from theme if variant exists, otherwise use custom color
  const themeStyle = theme.typography[mappedVariant] || theme.typography.body;
  
  // for backward compatibility
  const color = lightColor || darkColor || themeStyle.color;

  return (
    <Text
      style={[
        themeStyle,
        color && { color },
        textVariant === 'defaultSemiBold' && { fontWeight: '600' },
        textVariant === 'link' && { color: theme.colors.button.primary.background },
        style,
      ]}
      {...rest}
    />
  );
}
