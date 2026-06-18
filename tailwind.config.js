/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        horror: {
          black: "#0a0a0f",
          dark: "#12121a",
          gray: "#1a1a24",
          lightGray: "#2a2a3a",
          green: "#1a3a2a",
          neonGreen: "#39ff14",
          red: "#8b0000",
          neonRed: "#ff3333",
          orange: "#ff6b35",
          amber: "#f59e0b",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        horror: ['"Creepster"', "cursive"],
        terminal: ['"VT323"', "monospace"],
        display: ['"Special Elite"', '"Courier New"', "monospace"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      animation: {
        "scan-line": "scanLine 4s linear infinite",
        "flicker": "flicker 0.15s infinite",
        "glitch": "glitch 2s infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "noise": "noise 0.5s steps(10) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "typewriter": "typewriter 3s steps(40) forwards",
        "blink": "blink 1s step-end infinite",
        "rotate-slow": "rotate 20s linear infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
        noise: {
          "0%, 100%": { backgroundPosition: "0 0" },
          "10%": { backgroundPosition: "-5% -10%" },
          "20%": { backgroundPosition: "-15% 5%" },
          "30%": { backgroundPosition: "7% -25%" },
          "40%": { backgroundPosition: "-5% 25%" },
          "50%": { backgroundPosition: "-15% 10%" },
          "60%": { backgroundPosition: "15% 0%" },
          "70%": { backgroundPosition: "0 15%" },
          "80%": { backgroundPosition: "3% 35%" },
          "90%": { backgroundPosition: "-10% 10%" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px #39ff14, 0 0 10px #39ff14" },
          "100%": { boxShadow: "0 0 10px #39ff14, 0 0 20px #39ff14, 0 0 30px #39ff14" },
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        rotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        "horror": "0 0 15px rgba(57, 255, 20, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.5)",
        "horror-red": "0 0 15px rgba(255, 51, 51, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.5)",
        "crt": "inset 0 0 100px rgba(0, 0, 0, 0.7), 0 0 20px rgba(57, 255, 20, 0.1)",
        "radio": "0 4px 6px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      },
      backgroundImage: {
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        "gradient-horror": "linear-gradient(135deg, #0a0a0f 0%, #1a1a24 50%, #0a0a0f 100%)",
      },
    },
  },
  plugins: [],
};
