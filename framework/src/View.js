const fs = require('fs');

class View {
    constructor() {
        this.part = {};
    }

    // - SET PARTS
    set(data) {
        for(let key in data) this.part[key] = data[key];
    }

    // - RENDER VIEW
    print(Candy) {
        if (Candy.Request.res.finished) return;
        let result = '';
        if (this.part.skeleton && fs.existsSync(`./skeleton/${this.part.skeleton}.html`)) {
            result = fs.readFileSync(`./skeleton/${this.part.skeleton}.html`, 'utf8');
            for (let key in this.part) {
                if (key === 'skeleton') continue;
                if (this.part[key] && fs.existsSync(`./view/${key}/${this.part[key]}.html`)) result = result.replace(`{{ ${key} }}`, fs.readFileSync(`./view/${key}/${this.part[key]}.html`, 'utf8'));
            }
        }
        Candy.Request.header('Content-Type', 'text/html');
        Candy.return(result);
    }
}

module.exports = View;