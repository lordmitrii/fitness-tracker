const baseUnit = 4;

// Spacing scale (Tailwind spacing scale)
export const spacing = {
  0: 0,
  1: baseUnit * 1, // 4px
  2: baseUnit * 2, // 8px
  3: baseUnit * 3, // 12px
  4: baseUnit * 4, // 16px
  5: baseUnit * 5, // 20px
  6: baseUnit * 6, // 24px
  8: baseUnit * 8, // 32px
  10: baseUnit * 10, // 40px
  12: baseUnit * 12, // 48px
  16: baseUnit * 16, // 64px
  20: baseUnit * 20, // 80px
  24: baseUnit * 24, // 96px
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  '2xl': 16, // rounded-2xl
  full: 9999,
};

// Layout constants (from CSS variables)
export const layout = {
  headerSize: 48, // 3rem = 48px
  menubarHeight: 80, // 5rem = 80px (mobile)
  menubarWidth: 0, // 0px (mobile), 400px (desktop - handled via responsive design)
  menubarWidthDesktop: 400,
};

// Shadow presets (React Native shadow properties)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

