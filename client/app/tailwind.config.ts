module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            backgroundColor: {
                'main-100': '#e7ecec',
                'main-200': '#dde4e4',
                'main-300': '#ced9d9',
                'main-400': '#c0d8d8',
                'main-500': '#0e8080'
            },

            colors: {
                'main-100': '#e7ecec',
                'main-200': '#dde4e4',
                'main-300': '#ced9d9',
                'main-400': '#c0d8d8',
                'main-500': '#0e8080'
            },

            keyframes: {
                'slide-right': {
                    '0%': {
                        '-webkit-transform': 'translateX(-100%);',
                        transform: 'translateX(-100%);'
                    },
                    '100%': {
                        '-webkit-transform': 'translateX(0);',
                        transform: 'translateX(0);'
                    }
                },
                'slide-left': {
                    '0%': {
                        '-webkit-transform': 'translateX(100%);',
                        transform: 'translateX(100%);'
                    },
                    '100%': {
                        '-webkit-transform': 'translateX(0);',
                        transform: 'translateX(0);'
                    }
                },
                'slide-left-two': {
                    '0%': {
                        '-webkit-transform': 'translateX(100%);',
                        transform: 'translateX(100%);'
                    },
                    '100%': {
                        '-webkit-transform': 'translateX(0);',
                        transform: 'translateX(0);'
                    }
                }
            },

            animation: {
                'slide-right': 'slide-right .5s cubic-bezier(.25,.46,.45,.94) both;',
                'slide-left': 'slide-left .5s cubic-bezier(.25,.46,.45,.94) both;',
                'slide-left-two': 'slide-left-two .5s cubic-bezier(.25,.46,.45,.94) both;'
            }
        },
        screens: {
            'laptop': '1500px'
        }
    },
    plugins: [],
}