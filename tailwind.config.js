/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}","src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
			colors: {
				primary: '#1B1B3A',
				tertiary: '#8A2BE2',
				secondary: '#232344',
				light: {
					100: '#D6C6FF',
					200: '#A8D5DB',
					300: '#9CA4AB',
					400: '#FFFFFF',
				},

				dark: {
					100: '#221F3D',
					200: '#0f0d23',
				},
				accent: '#AB8BFF',
			},
			fontFamily: {
				pthin: ["Poppins-Thin", "sans-serif"],
				pextralight: ["Poppins-ExtraLight", "sans-serif"],
				plight: ["Poppins-Light", "sans-serif"],
				pregular: ["Poppins-Regular", "sans-serif"],
				pmedium: ["Poppins-Medium", "sans-serif"],
				psemibold: ["Poppins-SemiBold", "sans-serif"],
				pbold: ["Poppins-Bold", "sans-serif"],
				pextrabold: ["Poppins-ExtraBold", "sans-serif"],
				pblack: ["Poppins-Black", "sans-serif"],
			},
			
		},
  },
  plugins: [],
}