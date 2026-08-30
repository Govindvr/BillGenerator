// Material Design 3 Theme Configuration
// Purple/Indigo Color Palette

import {MD3LightTheme} from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Material Design 3 - Purple/Indigo Palette
    primary: '#6750A4', // Primary Purple
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF', // Light purple
    onPrimaryContainer: '#21005D',

    secondary: '#625B71', // Mauve
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',

    tertiary: '#7D5260', // Rose
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD8E4',
    onTertiaryContainer: '#31111D',

    error: '#B3261E', // Red
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',

    background: '#FFFBFE', // Off-white
    onBackground: '#1C1B1F',
    surface: '#FFFBFE',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454E',

    outline: '#79747E',
    outlineVariant: '#CAC4D0',

    // Additional utility colors
    success: '#2E7D32', // Green
    warning: '#F57C00', // Orange
    info: '#1976D2', // Blue
  },
};

export default theme;
