import { PropsWithChildren, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { ThemedText } from '@/src/shared/ui/ThemedText';
import { ThemedView } from '@/src/shared/ui/ThemedView';
import { IconSymbol } from '@/src/shared/ui/icon-symbol';
import { useTheme } from '@/src/shared/lib/context/ThemeContext';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <ThemedView>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[2] || 8,
        }}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme.colors.text.secondary}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText variant="body" style={{ fontWeight: '600' }}>{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && (
        <ThemedView style={{ marginTop: theme.spacing[2] || 8, marginLeft: theme.spacing[6] }}>
          {children}
        </ThemedView>
      )}
    </ThemedView>
  );
}
