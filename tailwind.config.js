/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    'grid-cols-6',
    'grid-cols-7', 
    'grid-cols-9'
  ],
  theme: {
    extend: {
      transitionProperty: {
        position: "left, top, transform",
      },
      transitionDuration: {
        1000: "1000ms",
      },
      transitionTimingFunction: {
        move: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "gradient-xy": "gradient 6s linear infinite",
        "border-glow": "borderGlow 4s ease-in-out infinite",
      },
      keyframes: {
        gradient: {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
            "background-image":
              "linear-gradient(115deg, transparent, transparent, rgba(59,130,246,0.2), transparent, transparent)",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
            "background-image":
              "linear-gradient(115deg, transparent, transparent, rgba(59,130,246,0.2), transparent, transparent)",
          },
        },
        borderGlow: {
          "0%, 100%": {
            "border-color": "rgba(255,255,255,0.03)",
          },
          "50%": {
            "border-color": "rgba(59,130,246,0.2)",
          },
        },
      },
    },
  },
  plugins: [],
};
