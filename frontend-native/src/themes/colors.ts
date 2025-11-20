export const lightColors = {
  // Base colors
  black: '#000000',
  white: '#ffffff',

  // Gray scale (Tailwind defaults for light mode)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Blue scale (Tailwind defaults for light mode)
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  sky: {
    600: '#0284c7',
  },

  // Green scale (Tailwind defaults for light mode)
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Red scale (Tailwind defaults for light mode)
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Pink scale (Tailwind defaults for light mode)
  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9f1239',
    900: '#831843',
  },

  // Yellow scale (Tailwind defaults for light mode)
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
};

export const darkColors = {
  // Base colors (inverted for dark mode)
  black: '#ffffff',
  white: '#4b5365', // rgb(75, 83, 101)

  // Gray scale (from CSS dark mode)
  gray: {
    50: '#646d81', // rgb(100, 109, 129)
    100: '#383d49',
    200: '#444956', // rgb(68, 73, 86)
    300: '#5f667c', // rgb(95, 102, 124)
    400: '#70788f', // rgb(112, 120, 143)
    500: '#9faeca', // rgb(159, 174, 202)
    600: '#98a0b3', // rgb(152, 160, 179)
    700: '#bbc0ce', // rgb(187, 192, 206)
    800: '#e3e6ee', // rgb(227, 230, 238)
    900: '#ffffff',
  },

  // Blue scale (from CSS dark mode)
  blue: {
    50: '#273c5c',
    100: '#385780',
    200: '#4b6cb3',
    300: '#5a8bf7',
    400: '#68a7ff',
    500: '#7bc3ff',
    600: '#a4daff',
    700: '#c2edff',
    800: '#e1f6ff',
    900: '#f5fcff',
  },
  sky: {
    600: '#309ccf',
  },

  // Green scale (from CSS dark mode)
  green: {
    50: '#1a3d2b',
    100: '#2cb36d',
    200: '#24613f',
    300: '#2a7b4c',
    400: '#2f8e59',
    500: '#34a166',
    600: '#3bbf7b',
    700: '#44d18f',
    800: '#4de3a3',
    900: '#56f5b7',
  },

  // Red scale (using Tailwind defaults, adjust if needed)
  red: {
    50: '#7f1d1d',
    100: '#991b1b',
    200: '#b91c1c',
    300: '#dc2626',
    400: '#ef4444',
    500: '#f87171',
    600: '#fca5a5',
    700: '#fecaca',
    800: '#fee2e2',
    900: '#fef2f2',
  },

  // Pink scale (using Tailwind defaults, adjust if needed)
  pink: {
    50: '#831843',
    100: '#9f1239',
    200: '#be185d',
    300: '#db2777',
    400: '#ec4899',
    500: '#f472b6',
    600: '#f9a8d4',
    700: '#fbcfe8',
    800: '#fce7f3',
    900: '#fdf2f8',
  },

  // Yellow scale (using Tailwind defaults, adjust if needed)
  yellow: {
    50: '#713f12',
    100: '#854d0e',
    200: '#a16207',
    300: '#ca8a04',
    400: '#eab308',
    500: '#facc15',
    600: '#fde047',
    700: '#fef08a',
    800: '#fef9c3',
    900: '#fefce8',
  },
};

export type ColorPalette = typeof lightColors;
export type ThemeColors = {
  background: string;
  foreground: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  border: string;
  card: {
    background: string;
    border: string;
  };
  input: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
  };
  button: {
    primary: {
      background: string;
      text: string;
    };
    secondary: {
      background: string;
      text: string;
    };
    danger: {
      background: string;
      text: string;
    };
    success: {
      background: string;
      text: string;
    };
    warning: {
      background: string;
      text: string;
    };
  };
  status: {
    error: {
      background: string;
      border: string;
      text: string;
    };
    success: {
      background: string;
      border: string;
      text: string;
    };
  };
};

export const createThemeColors = (isDark: boolean): ThemeColors => {
  const colors = isDark ? darkColors : lightColors;

  return {
    background: colors.white,
    foreground: colors.black,
    text: {
      primary: colors.gray[800],
      secondary: colors.gray[700],
      tertiary: colors.gray[500],
      inverse: colors.white,
    },
    border: colors.gray[300],
    card: {
      background: colors.white,
      border: colors.gray[200],
    },
    input: {
      background: isDark ? colors.gray[400] : colors.white,
      border: colors.gray[300],
      text: isDark ? colors.gray[800] : colors.gray[900],
      placeholder: colors.gray[600],
    },
    button: {
      primary: {
        background: colors.blue[600],
        text: colors.white,
      },
      secondary: {
        background: colors.gray[600],
        text: colors.white,
      },
      danger: {
        background: colors.red[500],
        text: colors.white,
      },
      success: {
        background: colors.green[500],
        text: colors.white,
      },
      warning: {
        background: colors.yellow[600],
        text: colors.white,
      },
    },
    status: {
      error: {
        background: colors.red[100],
        border: colors.red[200],
        text: colors.red[700],
      },
      success: {
        background: colors.blue[100],
        border: colors.blue[200],
        text: colors.blue[700],
      },
    },
  };
};

