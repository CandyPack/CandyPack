# Routing: Directing Your Web Traffic

Routing is like being a traffic cop for your website. It's the process of looking at a URL a user is visiting and deciding which piece of your code should handle it. In CandyPack, you'll define all your routes in `route/` files using the global `Candy.Route` object.

Routes are defined for different HTTP methods (`GET`, `POST`, etc.) and can be configured to require authentication.