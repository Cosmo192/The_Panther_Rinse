/** Clean Blue design tokens. Loaded explicitly by Tailwind v4 in src/styles.css. */
export default {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0066CC', hover: '#0052A3', active: '#003D7A', soft: '#EAF3FF' },
        success: { DEFAULT: '#00CC66', ink: '#006633', soft: '#E6FAEF', border: '#80E6B3' },
        danger: { DEFAULT: '#FF3333', ink: '#B31919', soft: '#FFF0F0', border: '#FF9999' },
        canvas: '#FFFFFF',
        surface: '#F5F7FA',
        ink: '#1A1A1A',
        muted: '#566173',
        line: '#D8DFE8',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      screens: { xs: '400px' },
      borderRadius: { card: '1rem', control: '0.75rem' },
    },
  },
};
