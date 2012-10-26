// CSS build file
var util = require('util'),
    fs = require('fs'),
    less = require('less'),
    glob = require('glob');

// Config paths
var LESS_DIR = './static/css/less/',
    LESS_BUILD_FILE = 'main.less',
    CSS_OUTPUT_DIR = './static/css/';

desc('This is the default task');
task('default', function() {
    util.puts('This is the default task');
});

var buildLess = function() {
    var parser = new(less.Parser)({
        paths: [LESS_DIR]
    });

    // Read CSS main file
    buildLessFile(parser, LESS_DIR + LESS_BUILD_FILE, CSS_OUTPUT_DIR + 'main.css', null);
};

var buildLessFile = function(parser, lessFile, cssFile, callback) {
    fs.readFile(lessFile, 'utf-8', function(err, data) {
        if (err) {
            console.log(err);
        } else {
            parser.parse(data, function(e, tree) {
                if (e) {
                    console.log(e);
                } else {
                    try {
                        fs.writeFile(cssFile, tree.toCSS(), 'utf-8', function(err) {
                            if (err) throw err;
                            util.puts('Less files built to -> ' + cssFile);
                            
                            if(callback) callback.call(this);
                        });
                    } catch (err) {
                        console.log('\033[31mError: ' + err.message);
                        console.log('\033[31mFile: ' + err.filename);
                        console.log('\033[31mLine: ' + err.line);
                        console.log('\033[31mExtract: ' + err.extract[0] + '\033[0m');
                    }
                }
            });
        }
    });
};

desc('This builds the less files.');
task('build', function() {
    buildLess();
});

desc('This watches the less files and builds them when a change is made.');
task('watch', function() {
    var files = glob.sync(LESS_DIR + '**/*.less');
    util.puts('Now watching css files for changes');
    files.forEach(function(file) {
        fs.watchFile(file, {interval: 50}, function(prev, curr) {
            if(+prev.mtime !== +curr.mtime) {
                buildLess();
            }
        });
    });
});
