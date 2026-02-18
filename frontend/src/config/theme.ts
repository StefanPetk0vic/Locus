
export const Colors = {  
  primary: '#1D1C1A',  
  secondary: '#FFD400',  
  background: '#F5F5F7',  
  text: '#1D1C1A',  
  textSecondary: '#8E8E93',  
  surface: '#FFFFFF',
  border: '#E5E5EA',
  primaryLight: '#F5F4F0',
  secondaryLight: '#FFF8D6',
  success: '#34C759',
  error: '#FF3B30',
  overlay: 'rgba(0, 0, 0, 0.35)',
} as const;
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.32,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.08,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0,
  },
} as const;
export const Shadows = {  
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },  
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
