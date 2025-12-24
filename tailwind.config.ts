/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./safelist.txt",
  ],
  safelist: [
    "max-h-0",
    "max-h-screen",
    "opacity-0",
    "opacity-100",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}