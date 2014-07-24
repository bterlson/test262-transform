module.exports = parse;
var Path = require('path');


function findImplicitIncludes(test) {
    var incs = [];

    if(test.body.indexOf('$PRINT') > -1) {
        incs.push('$PRINT.js');
    }

    if(test.body.indexOf('$FAIL') > -1) {
        incs.push('$FAIL.js');
    }

    if(test.body.indexOf('Test262Error') > -1) {
        incs.push('Test262Error.js');
    }

    if(test.body.indexOf('runTestCase') > -1) {
        incs.push('runTestCase.js');
    }

    if(test.body.indexOf('fnGlobalObject') > -1) {
        incs.push('fnGlobalObject.js');
    }

    if(test.body.indexOf('fnExists') > -1) {
        incs.push('fnExists.js');
    }

    if(test.body.indexOf('compareArray') > -1) {
        incs.push('compareArray.js');
    }

    if(test.body.indexOf('arrayContains') > -1) {
        incs.push('arrayContains.js');
    }

    if(test.body.indexOf('accessorPropertyAttributesAreCorrect') > -1) {
        incs.push('accessorPropertyAttributesAreCorrect.js');
    }

    if(test.body.indexOf('dataPropertyAttributesAreCorrect') > -1) {
        incs.push('dataPropertyAttributesAreCorrect.js');
    }

    if(test.body.indexOf('fnSupportsArrayIndexGetters') > -1) {
        incs.push('fnSupportsArrayIndexGetters.js');
    }

    return incs;
}

function parse(file, path) {
    var test = {
        desc: '',
        attrs: {},
        includes: [],
        flags: []
    }

    var index = 0;


    if(path.indexOf('ch') > -1) {
        test.attrs.es5id = Path.basename(path).replace(/^S/, '').replace('.js', '');
    }

    function consume(re) {
        while(file[index].match(re)) index++;
    }

    function parseLine() {
        var next = file.substring(index).match(/(.*)$/m)[1];
        if(next == null) throw "this should never happen";

        index += next.length;
        consume(/ |\r|\n/);

        return next + '\n';
    }

    function parseCommentBlock() {
        var contents = '';

        if(file[index] === "/" && file[index + 1] === "/") {
            index += 2;

            consume(/\//);
            consumeWhitespace();
            contents += parseLine().replace(/ $/m, '');
            if(file[index] === "/" && file[index + 1] === "/") contents += parseCommentBlock();
        } else if(file[index] === "/" && file[index + 1] === "*") {
            index += 2
            var end = file.indexOf('*/', index)
            contents += file.substring(index, end).replace(/(\r)?(\n)?^([\s*]+)/gm, '$2').trim();
            index = end + 2;
        } else {
            throw "expecting comment" + path;
        }

        return contents.trim();
    }

    function consumeWhitespace() {
        consume(/\s/);
    }

    function parseCopyright() {
        test.copyright = parseCommentBlock();
    }

    function parsePreamble() {

        var comment = parseCommentBlock();
        var lines = comment.split(/\r?\n/g);
        var line = 0;

        while(lines[line][0] !== '@') {
            test.desc += lines[line] + '\n';
            line++;
        }
        test.desc = test.desc.trim();

        while(line < lines.length) {
            var ws = lines[line].match(/ /);
            if(ws) {
                var attr = lines[line].substring(1, ws.index);
                var val = '';
                lines[line] = lines[line].substring(ws.index + 1);
                
                while(line < lines.length && lines[line][0] !== '@') {
                    val += lines[line].trim() + '  ';
                    line++;
                }

                test.attrs[attr] = val.trim();
            } else {
                attr = lines[line].substring(1);

                if(line < lines.length - 1 && lines[line + 1][0] !== "@") {
                    line++;

                    val = ''
                    while(line < lines.length && lines[line][0] !== '@') {
                        val += lines[line].trim() + '  ';
                        line++;
                    }
                    test.attrs[attr] = val.trim();
                } else {
                    test.flags.push(attr);
                    line++;
                }
            }
        }
    }

    function parseBody() {
        if(path.indexOf('ch06') > -1 || path.indexOf('ch07') > -1) {
            test.body = file.substring(index);
        } else {
            test.body = file.substring(index).replace(/\r\n/g, '\n');
        }
    }
    consumeWhitespace();
    parseCopyright();
    consumeWhitespace();
    parsePreamble();
    consume(/[\r\n]/);
    parseBody();

    test.body = test.body.replace(/\$INCLUDE\(["']([^"']+)["']\);?\r?\n?/g, function(_, include) {
        test.includes.push(include);

        return '';
    }).trim() + '\n';

    test.includes = findImplicitIncludes(test).concat(test.includes)
    return test;
}
