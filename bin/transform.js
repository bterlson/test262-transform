var transform = require('../lib/transform');
var fs = require('fs');
var glob = require('glob');

glob(process.argv[2], function(err, files) {
    files.forEach(function(file) {
        var contents = fs.readFileSync(file, 'utf-8');
        fs.writeFileSync(file, transform(contents, file), 'utf-8');
    })
})

