import { extendTheme } from '@chakra-ui/react';

// Define the gradient animation
const gradientAnimation = {
  '@keyframes gradientAnimation': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
};

// Define the custom theme
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#111827',
        color: '#f3f4f6',
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        minHeight: '100vh',
        overflowX: 'hidden',
        background: 'linear-gradient(125deg, #0f172a, #1e1b4b, #4a1d96, #701a75, #4a1d96, #1e1b4b, #0f172a)',
        backgroundSize: '300% 300%',
        animation: 'gradientAnimation 20s ease infinite',
        position: 'relative',
        _before: {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)',
          zIndex: -1,
          pointerEvents: 'none',
        },
        _after: {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")",
          opacity: 0.15,
          zIndex: -1,
          pointerEvents: 'none',
        },
      },
      '#root': {
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1.5rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      },
    },
  },
  colors: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // --primary-color
      600: '#4f46e5', // --primary-dark
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    secondary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399', // --secondary-light
      500: '#10b981', // --secondary-color
      600: '#059669', // --secondary-dark
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24', // --accent-light
      500: '#f59e0b', // --accent-color
      600: '#d97706', // --accent-dark
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6', // --text-color
      200: '#e5e7eb',
      300: '#d1d5db', // --text-secondary
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827', // --background-color
    },
    success: {
      500: '#10b981', // --success-color
    },
    error: {
      500: '#ef4444', // --error-color
    },
    warning: {
      500: '#f59e0b', // --warning-color
    },
    info: {
      500: '#3b82f6', // --info-color
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.1)', // --shadow-sm
    md: '0 4px 6px rgba(0, 0, 0, 0.1)', // --shadow-md
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)', // --shadow-lg
  },
  radii: {
    sm: '0.25rem', // --radius-sm
    md: '0.5rem', // --radius-md
    lg: '1rem', // --radius-lg
    full: '9999px', // --radius-full
  },
  transition: {
    fast: '150ms ease', // --transition-fast
    normal: '300ms ease', // --transition-normal
    slow: '500ms ease', // --transition-slow
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'full',
        position: 'relative',
        overflow: 'hidden',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: 'md',
        },
        _active: {
          transform: 'translateY(0)',
          boxShadow: 'sm',
        },
      },
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'rgba(30, 41, 59, 0.5)',
          borderRadius: 'lg',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          padding: '2rem',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          transition: 'transform 300ms ease, box-shadow 300ms ease',
          position: 'relative',
          overflow: 'hidden',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 40px 0 rgba(0, 0, 0, 0.45)',
            bg: 'rgba(30, 41, 59, 0.55)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
          },
          _before: {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent 50%, rgba(16, 185, 129, 0.05))',
            pointerEvents: 'none',
            zIndex: 0,
          },
        },
        header: {
          position: 'relative',
          zIndex: 1,
        },
        body: {
          position: 'relative',
          zIndex: 1,
        },
        footer: {
          position: 'relative',
          zIndex: 1,
        },
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            borderRadius: 'full',
            _selected: {
              color: 'white',
              bg: 'rgba(255, 255, 255, 0.1)',
            },
          },
          tablist: {
            bg: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 'full',
            p: '0.5rem',
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'primary.400',
        fontWeight: '700',
        letterSpacing: '-0.01em',
      },
    },
  },
});

export default theme;
