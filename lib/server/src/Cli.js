const { Console, log } = require('console');
const { Transform } = require('stream');
const readline = require('readline');
const fs = require('fs');
const os = require("os");

const Config = require('./Config.js');
const Lang = require('./Lang.js');

var rl;
var selected = 0;
var websites = {};
var services = [];
var domains = [];
var logs = {content: [], mtime: null, selected: null};
var printing = false;
var logging = false;
var width, height;

function format(text, raw){
    output = text.toString();
    if(output.toString().length > 1){
        let begin = '';
        let end = '';
        while(output.substr(output.length - 1) == ' '){
            end += ' ';
            output = output.substr(0, output.length - 1);
        }
        while(output.substr(0, 1) == ' '){
            begin += ' ';
            output = output.substr(1);
        }
        if(output.substr(output.length - 1) == ':'){
            end = ':';
            output = output.substr(0, output.length - 1);
        }
        output = begin + output + end;
    }
    if(!raw){
        if(text == 'CandyPack') output = color(output, 'magenta');
        if(text == Lang.get('Running')) output = color(output, 'green');
        if(text == '\u2713') output = color(output, 'green');
        if(text == '\u2717') output = color(output, 'red');
    }
    return output;
}

function length(text){
    return value(text, true).toString().replace(/\x1b\[[0-9;]*m/g, '').length;
}

function color(text, color, ...args){
    let output = text;
    let colors = {
        red: 31,
        green: 32,
        yellow: 33,
        blue: 34,
        magenta: 35,
        cyan: 36,
        white: 37,
        gray: 90
    };
    backgrounds = {
        red: 41,
        green: 42,
        yellow: 43,
        blue: 44,
        magenta: 45,
        cyan: 46,
        white: 47,
        gray: 100
    };
    if(colors[color]) output = '\x1b[' + colors[color] + 'm' + output + '\x1b[0m';
    for(const arg of args){
        if(backgrounds[arg]) output = '\x1b[' + backgrounds[arg] + 'm' + output + '\x1b[0m';
        if(arg == 'bold') output = '\x1b[1m' + output + '\x1b[0m';
    }
    return output;
}

function spacing(text, len, direction){
    if(direction == 'right') return ' '.repeat(len - length(text)) + text;
    if(direction == 'center') return ' '.repeat(Math.floor((len - length(text)) / 2)) + text + ' '.repeat(Math.ceil((len - length(text)) / 2))
    if(length(text) > len) return text.substr(0, len);
    return text + ' '.repeat(len - length(text));
}

function value(text, raw){
    if(!text) return '';
    if(typeof text == 'object') result = format(text.content);
    else result = format(text, raw);
    return result;
}

function icon(status, selected){
    if(status == 'running') return color(' \u25B6 ', 'green', selected ? 'white' : null);
    if(status == 'stopped') return color(' \u23F8 ', 'yellow', selected ? 'white' : null);
    if(status == 'errored') return color(' ! ', 'red', selected ? 'white' : null);
    return '   ';
}

async function getLog(){
    if(logging) return;
    logging = true;
    logs.selected = selected;
    let file = null;
    if(selected < domains.length){
        file = os.homedir() + '/.candypack/logs/' + domains[selected] + '.log';
    } else if(selected - domains.length < services.length){
        file = os.homedir() + '/.candypack/logs/' + services[selected - domains.length].name + '.log';
    } else {
        logging = false;
        return;
    }
    let log = '';
    let mtime = null;
    if(fs.existsSync(file)){
        mtime = fs.statSync(file).mtime;
        if(selected == logs.selected && mtime == logs.mtime) return;
        log = fs.readFileSync(file, 'utf8');
    }
    logs.content = log.trim().split('\n').map(function(line){
        if('[LOG]' == line.substr(0, 5)){
            line = line = line.substr(5);
            let date = parseInt(line.substr(1, 13));
            line = color('[' + new Date(date).toLocaleString() + ']', 'green', 'bold') + line.substr(15);
        } else if ('[ERR]' == line.substr(0, 5)){
            line = line = line.substr(5);
            let date = parseInt(line.substr(1, 13));
            line = color('[' + new Date(date).toLocaleString() + ']', 'red', 'bold') + line.substr(15);
        }
        return line;
    }).slice(-height + 4);
    logs.mtime = mtime;
    logging = false;
}


function monitor(){
    if(printing) return;
    printing = true;
    Config.load();
    websites = Config.get('websites') ?? [];
    services = Config.get('services') ?? [];
    domains = Object.keys(websites);
    width = process.stdout.columns - 5;
    height = process.stdout.rows - 2;
    getLog();
    let c1 = (width / 12) * 3;
    if(c1 % 1 != 0) c1 = c1 - 1;
    if(c1 > 50) c1 = 50;
    result = color('\n' + spacing('CANDYPACK', width, 'center') + '\n\n', 'magenta', 'bold');
    result += color(' ┌', 'gray');
    if(domains.length){
        result += color('─'.repeat(5), 'gray');
        let title = color(Lang.get('Domains'), null);
        result += ' ' + color(title) + ' ';
        result += color('─'.repeat(c1 - title.length - 7), 'gray');
    } else {
        result += color('─'.repeat(c1), 'gray');
    }
    result += color('┬', 'gray');
    result += color('─'.repeat(width - c1), 'gray');
    result += color('┐ \n', 'gray');
    let service = -1;
    for(let i = 0; i < height - 4; i++){
        if(domains[i]){
            result += color(' │', 'gray');
            result += icon(websites[domains[i]].status ?? null, i == selected);
            result += color(spacing(domains[i] ? domains[i] : '', c1 - 3), i == selected ? 'blue' : 'white', i == selected ? 'white' : null, i == selected ? 'bold' : null);
            result += color('│', 'gray');
        } else if(services.length && service == -1){
            result += color(' ├','gray');
            result += color('─'.repeat(5), 'gray');
            let title = color(Lang.get('Services'), null);
            result += ' ' + color(title) + ' ';
            result += color('─'.repeat(c1 - title.length - 7), 'gray');
            result += color('┤','gray');
            service++;
        } else if(service > 0 && service < services.length){
            result += color(' │', 'gray');
            result += icon(services[service].status ?? null, i - 1 == selected);
            result += color(spacing(services[service].name, c1 - 3), i - 1 == selected ? 'blue' : 'white', i - 1 == selected ? 'white' : null, i - 1 == selected ? 'bold' : null);
            result += color('│', 'gray');
            service++;
        } else {
            result += color(' │', 'gray');
            result += ' '.repeat(c1);
            result += color('│', 'gray');
        }
        if(logs.selected == selected){
            result += spacing(logs.content[i] ? logs.content[i] : '', width - c1);
        } else {
            result += ' '.repeat(width - c1);
        }
        result += color('│\n', 'gray');
    }
    result += color(' └', 'gray');
    result += color('─'.repeat(c1), 'gray');
    result += color('┴', 'gray');
    result += color('─'.repeat(width - c1), 'gray');
    result += color('┘ \n', 'gray');
    process.stdout.clearLine(0);
    process.stdout.write('\033c');
    process.stdout.write(result);
    printing = false;
}

module.exports = {
    table: function(input) {
        let result = '';
        let width = [];
        for (const row of input) {
            for (const key of Object.keys(row)) {
                if(input.indexOf(row) == 0) width[key] = length(key);
                if(length(row[key]) > width[key]) width[key] = length(row[key]);
            }
        }
        for (const row of input) {
            let insert = '';
            if(input.indexOf(row) == 0){
                result += '┌─';
                for(const key of Object.keys(row)) result += '─'.repeat(width[key]) + '─┬─';
                result = color(result.substr(0, result.length - 3) + '─┐\n', 'gray');
                result += color('│ ', 'gray');
                for(const key of Object.keys(row)){
                    result += color(value(key), 'blue') + ' '.repeat(width[key] - length(key)) + color(' │ ', 'gray');
                }
                result += '\n';
            }
            insert += '├─';
            for(const key of Object.keys(row)) insert += '─'.repeat(width[key]) + '─┼─';
            insert = insert.substr(0, insert.length - 3) + '─┤\n';
            insert += '│ ';
            result += color(insert, 'gray');
            for(const key of Object.keys(row)){
                result += value(row[key]) + ' '.repeat(width[key] - length(row[key])) + color(' │ ', 'gray');
            }
            result += '\n';
        }
        insert = '└─';
        for(const key of Object.keys(input[0])) insert += '─'.repeat(width[key]) + '─┴─';
        insert = insert.substr(0, insert.length - 3) + '─┘';
        result += color(insert, 'gray');
        console.log(result);
    },
    log: async function(...args) {
        let output = '';
        for(let i = 0; i < args.length; i++){
            let arg = format(args[i]);
            output += arg;
            if(i < arg.length - 1) output += ' ';
        }
        console.log(output);
    },
    monitor: async function() {
        process.stdout.write(process.platform === 'win32' ? `title CandyPack Monitor\n` : `\x1b]2;CandyPack Monitor\x1b\x5c`);
        await monitor();
        setInterval(monitor, 250);
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.input.on('keypress', (key, data) => {
            if(data.ctrl && data.name == 'c') {
                process.stdout.write('\033c');
                process.exit(0);
            }
            if(data.name == 'up') if(selected > 0) selected--;
            if(data.name == 'down') if(selected + 1 < domains.length + services.length) selected++;
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            monitor();
        });
        rl.on('close', () => {
            process.stdout.write('\033c');
            process.exit(0);
        });
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }
}