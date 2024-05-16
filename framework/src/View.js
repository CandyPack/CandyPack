const fs = require('fs');

class View {
    #part    = {};
    #request = null;

    constructor(request) {
        this.#request = request;
    }

    // - SET PARTS
    set(data) {
        for(let key in data) this.#part[key] = data[key];
    }

    // - PRINT VIEW
    print() {
        if (this.#request.res.finished) return;
        let result = '';
        if (this.#part.skeleton && fs.existsSync(`./skeleton/${this.#part.skeleton}.html`)) {
            result = fs.readFileSync(`./skeleton/${this.#part.skeleton}.html`, 'utf8');
            for (let key in this.#part) {
                if(key === 'skeleton') continue;
                if(!this.#part[key])    continue;
                if(this.#part[key].includes('.')) this.#part[key] = this.#part[key].replace(/\./g, '/');
                if(fs.existsSync(`./view/${key}/${this.#part[key]}.html`)) result = result.replace(`{{ ${key.toUpperCase()} }}`, this.#render(`./view/${key}/${this.#part[key]}.html`));
            }
        }
        this.#request.header('Content-Type', 'text/html');
        this.#request.end(result);
    }

    #render(file){
        let output = fs.readFileSync(file, 'utf8');
        let snippets = output.match(/{{.*?}}/g);
        let get = (key) => this.#request.get(key);
        if(!snippets) return output;
        for (let snippet of snippets) {
            let key = snippet.replace(/{{|}}/g, '').trim();
            try {
                output = output.replace(snippet, eval(key));
            } catch (e) {
                let line = output.split('\n').indexOf(output.split('\n').find((line) => line.includes(snippet)))+1;
                console.error(`Error: "${key}" in line ${line} of "${file}"`)
                console.error(e.toString().split('\n')[0]);
            }
        }
        return output;
    }
}

module.exports = View;