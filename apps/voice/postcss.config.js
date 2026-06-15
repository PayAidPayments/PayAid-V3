const path = require('path')

module.exports = {
  plugins: {
    // Pin voice Tailwind config — repo-root tailwind.config.ts has no apps/voice paths on Vercel.
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.ts') },
    autoprefixer: {},
  },
}
