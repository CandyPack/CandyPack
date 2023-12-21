const { Transform } = require('stream');
const { Console, log } = require('console');

const Lang = require('./Lang.js');

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
    return value(text, true).toString().length;
}

function color(text, color){
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
    return '\x1b[' + colors[color] + 'm' + text + '\x1b[0m';
}

function spacing(text, len, direction){
    if(direction == 'right') return ' '.repeat(len - length(text)) + text;
    return text + ' '.repeat(len - length(text));
}

function value(text, raw){
    if(!text) return '';
    if(typeof text == 'object') result = format(text.content);
    else result = format(text, raw);
    return result;
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
    }
}