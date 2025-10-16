/**
 * About Page Controller
 *
 * This controller renders the about page using CandyPack's skeleton-based view system.
 * Provides information about CandyPack and its key components.
 *
 * For AJAX requests, only content is returned. For full page loads, skeleton + content.
 */

/**
 * About Page Controller
 *
 * Uses CandyPack's skeleton-based view system.
 */

module.exports = function (Candy) {
  // Set variables for AJAX responses
  Candy.set(
    {
      pageTitle: 'About CandyPack',
      version: '1.0.0'
    },
    true
  )

  Candy.View.set({
    skeleton: 'main',
    header: 'main',
    content: 'about',
    footer: 'main'
  })
}
