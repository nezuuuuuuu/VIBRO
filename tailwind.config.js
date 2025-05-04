/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}","src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
		colors: {
			primary: '#1B1B3A',
			secondary: '#8A2BE2',
			lightsecondary: '#B46BF7',
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
			pthin: ['Poppins-Thin'],
			pextralight: ['Poppins-ExtraLight'],
			plight: ['Poppins-Light'],
			pregular: ['Poppins-Regular'],
			pmedium: ['Poppins-Medium'],
			psemibold: ['Poppins-SemiBold'],
			pbold: ['Poppins-Bold'],
			pextrabold: ['Poppins-ExtraBold'],
			pblack: ['Poppins-Black'],
		  },
		
	},
  },
  plugins: [],
}