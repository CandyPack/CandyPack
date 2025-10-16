/**
 * Home Page Controller
 *
 * This controller renders the home page using CandyPack's skeleton-based view system.
 * The skeleton provides the layout (header, nav, footer) and the view provides the content.
 *
 * For AJAX requests (candy-link navigation), only the content is returned.
 * For full page loads, skeleton + content is returned.
 *
 * This page demonstrates:
 * - Modern, responsive design
 * - candy.js AJAX form handling
 * - candy.js GET requests
 * - Dynamic page loading with candy-link
 */

/**
 * Home Page Controller
 *
 * Uses CandyPack's skeleton-based view system.
 * Skeleton provides the layout, views provide the content.
 */

module.exports = function (Candy) {
  // Set variables that will be available in AJAX responses
  Candy.set(
    {
      welcomeMessage: 'Welcome to CandyPack!',
      timestamp: Date.now()
    },
    true
  ) // true = include in AJAX responses

  Candy.View.set({
    skeleton: 'main',
    head: 'main',
    header: 'main',
    content: 'home',
    footer: 'main'
  })
}
