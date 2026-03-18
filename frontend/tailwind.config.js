/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                'bg-elevated': 'var(--bg-elevated)',
                'border-subtle': 'var(--border-subtle)',
                'border-medium': 'var(--border-medium)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                'accent-gold': 'var(--accent-gold)',
                'accent-gold-dim': 'var(--accent-gold-dim)',
                'success': 'var(--success)',
                'danger': 'var(--danger)',
                'danger-bright': 'var(--danger-bright)',
                'info': 'var(--info)'
            },
            fontFamily: {
                serif: ['"DM Serif Display"', 'serif'],
                sans: ['"DM Sans"', 'sans-serif'],
                mono: ['"DM Mono"', 'monospace'],
            },
        },
    },
    plugins: [],
}
