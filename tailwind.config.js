/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cusat: {
                    primary: '#d32f2f', // Example CUSAT red
                    secondary: '#1976d2',
                }
            }
        },
    },
    plugins: [],
}
