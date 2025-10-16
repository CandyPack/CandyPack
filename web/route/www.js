// ============================================
// Page Routes
// ============================================
// Page routes render HTML views and support AJAX loading via candy.js
// Controllers are located in controller/page/ directory

// Home page - displays welcome message, features, and interactive demos
Candy.Route.page('/', 'index')

// About page - provides information about CandyPack
Candy.Route.page('/about', 'about')

// ============================================
// API Routes
// ============================================
// Add your API routes here
// Example:
// Candy.Route.post('/api/contact', 'contact')
// Candy.Route.get('/api/data', 'data')
