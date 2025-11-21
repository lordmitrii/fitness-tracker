import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'background' | 'card' | 'input';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'background',
  ...otherProps 
}: ThemedViewProps) {
  const { theme } = useTheme();

  // for backward compatibility
  let backgroundColor = lightColor || darkColor;
  
  if (!backgroundColor) {
    switch (variant) {
      case 'card':
        backgroundColor = theme.colors.card.background;
        break;
      case 'input':
        backgroundColor = theme.colors.input.background;
        break;
      case 'background':
      default:
        backgroundColor = theme.colors.background;
        break;
    }
  }

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
