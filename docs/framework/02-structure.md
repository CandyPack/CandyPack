# Where Do I Put My Files?

A well-organized project is a happy project! CandyPack encourages a simple and clean directory structure to help you find your files easily and keep your code tidy. We even give you a starting template in the `web/` directory of the main repository.

## 📂 Typical Project Layout

Let's take a look at a typical project layout:

-   `project_root/`
    -   `config.json`: This is where you'll keep your app's secrets and settings, like database passwords or API keys.
    -   `index.js`: The starting pistol for your web application! This file kicks off the CandyPack framework.
    -   `public/`: All files placed in this folder are directly accessible from the outside. This is the perfect place for your images, stylesheets, and client-side JavaScript.
    -   `route/`: This folder holds all your route definitions. The filename of the route file corresponds to the subdomain it serves.
        -   `www.js`: Used for routes on your main domain (e.g., `www.example.com` or `example.com`).
        -   `api.js`: Used for routes on a subdomain (e.g., `api.example.com`). When a request comes in for `api.example.com`, this is the route file that gets used. You can create files for any subdomain!
    -   `controller/`: This is where the magic happens! Controllers contain the main logic for your application.
        -   `page/`: We suggest putting controllers that show HTML pages in here.
        -   `api/`: If you're building an API, it's a great idea to keep those controllers separate in their own folder.
    -   `view/`: For all your HTML template files. This is what your users will see.

Following this structure helps keep your code's responsibilities separate. Your routing logic lives in one place, your app logic in another, and your presentation files in a third. It's a recipe for success!
