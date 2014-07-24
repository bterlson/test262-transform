module.exports = transform;
var parse = require('./parse');
var makeWrapper = require('wordwrap');
var width = 80;


function transform(contents, path) {
    var s = '';
    var test = parse(contents, path);
    s += '// ' + test.copyright.replace(/\n/g, '\n// ') + '\n\n'
    s += '/*---\n';

    function emitValue(val) {
        if(val.indexOf(':') > -1 || val[0] === '"' || val[0] === "*" || val[0] === '{' || val[0] === '[' || val[0] === "'") {
            return '"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
        } else {
            return val;
        }
    }

    function emitKey(key, val) {
        // some keys already end in colon.
        if(key.match(/:$/)) key = key.substring(0, key.length - 1);

        if(Array.isArray(val)) {
            if(val.length === 0) return '';
            if(val.length === 1) return key + ': [' + val[0] + ']\n';

            return key + ':\n' + val.map(function(v) { return '    - ' + v }).join('\n') + '\n';
        } else {
            if(val.indexOf('\n') > -1) {
                return key + ': >\n' + '    ' + val.replace(/\n/g, '\n    ') + '\n';
            } else if(key.length + val.length + 2 > width && val.indexOf(' ') > -1) {
                var wrap = makeWrapper(width - key.length - 2);
                val = wrap(val);
                return key + ': >\n' + '    ' + val.replace(/\n/g, '\n    ') + '\n';
            } else {
                return key + ': ' + emitValue(val) + '\n';
            }
        }
    }

    if(test.desc) {
        s += emitKey('info', test.desc);
    }
    Object.keys(test.attrs).forEach(function(attr) {
        if(attr === 'path') return;
        s += emitKey(attr, test.attrs[attr]);
    })

    s += emitKey('flags', test.flags);
    s += emitKey('includes', test.includes);
    s += '---*/\n\n';
    s += test.body;

    return s;
}
