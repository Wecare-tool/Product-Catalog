/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './*.tsx',
        './components/**/*.tsx',
        './services/**/*.ts',
        './utils/**/*.ts',
    ],
    theme: {
        extend: {
            colors: {
                wecare: {
                    blue: '#3492ab',
                    lightBlue: '#7FBACB',
                    paleBlue: '#C5E0E8',
                    darkBlue: '#236E84',
                    deepBlue: '#164553',
                    green: '#4CAF50',
                    offWhite: '#F8F9FA',
                    lightGrey: '#E9ECEF',
                    mediumGrey: '#6C757D',
                    charcoal: '#343A40',
                }
            },
            fontFamily: {
                lexend: ['Lexend', 'sans-serif'],
                roboto: ['Roboto', 'sans-serif'],
            }
        }
    },
    plugins: [],
};
