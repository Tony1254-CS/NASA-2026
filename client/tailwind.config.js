/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        space: {
          950: '#050811',
          900: '#070c1a',
          850: '#0a1226',
          800: '#0f1a36',
          700: '#17274f',
        },
        cyanGlow: {
          DEFAULT: '#38bdf8',
          deep: '#0284c7',
          light: '#7dd3fc',
          accent: '#06b6d4',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(14, 165, 233, 0.15)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.6), 0 0 25px -2px rgba(56, 189, 248, 0.25)',
        'radar-glow': '0 0 40px 10px rgba(14, 165, 233, 0.25), inset 0 0 20px 5px rgba(56, 189, 248, 0.2)',
        'cyan-ring': '0 0 15px 2px rgba(56, 189, 248, 0.4)',
      },
      animation: {
        'radar-sweep': 'radarSweep 4s linear infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float-subtle': 'floatSubtle 6s ease-in-out infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.03)' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      }
    },
  },
  plugins: [],
};
