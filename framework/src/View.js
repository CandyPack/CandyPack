const fs = require('fs');

class View {
    constructor() {
        this.part = {};
    }

    set(data) {
        for(let key in data) this.part[key] = data[key];
    }

    print(Candy) {
        if (Candy.res.finished) return;
        let result = '';
        if (this.part.skeleton && fs.existsSync(`./skeleton/${this.part.skeleton}.html`)) {
            result = fs.readFileSync(`./skeleton/${this.part.skeleton}.html`, 'utf8');
            for (let key in this.part) {
                if (key === 'skeleton') continue;
                if (this.part[key] && fs.existsSync(`./view/${key}/${this.part[key]}.html`)) result = result.replace(`{{ ${key} }}`, fs.readFileSync(`./view/${key}/${this.part[key]}.html`, 'utf8'));
            }
        }
        Candy.res.setHeader('Content-Type', 'text/html');
        Candy.return(result);
    }
}

module.exports = View;