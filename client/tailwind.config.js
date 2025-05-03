/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                playfair: ['"Playfair Display"', "serif"], // Add the font here
            },
            // screens: {
            //     sm: "640px",
            //     md: "768px",
            //     lg: "1024px",
            //     xl: "1280px",
            //     "2xl": "1536px",
            // },
        },
    },
    plugins: [],
};

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//   "./src/**/*.{js,jsx,ts,tsx}",
//   "./src/components/ui/**/*.{js,jsx,ts,tsx}",
// ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// };
