module.exports = {
  plugins: [
    // Support CSS imports
    require('postcss-import'),
    // Use the new Tailwind CSS PostCSS plugin
    require('@tailwindcss/postcss'),
    // Add vendor prefixes
    require('autoprefixer'),
  ]
};