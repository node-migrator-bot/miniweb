var fs   = require("fs"),
    path = require('path'),
    _    = require('underscore');

var logger = require('./logger'),
    walk = require('./environment').walk;

function loadTmpl(path, context, name) {
    logger.info('loading template: ' + path);
    try {
        var data = fs.readFileSync(path);
        name = name.substring(0, name.length - 4);
        context[name] = _.template(
          data.toString('utf8', 0, data.length)
        );
    } catch (e) {
        logger.error('Error parsing template: ' + e);
    }
}

exports.load = function (env, callback) {
    logger.info('loading templates...');
    var ctx = (env.templates = {});
    walk([env.path, 'app', 'templates'].join('/'), ctx, loadTmpl);

    var dirname = [env.path, 'modules'].join('/')
    fs.readdir(dirname, function (err, relnames) {
        if (err) {
            logger.error('Error when reading subapps: ' + err);
            return;
        }
        relnames.forEach(function (relname, index, relnames) {
            var name = path.join(dirname, relname),
                counter = 0;
            fs.stat(name, function (err, stat) {
                if(err) {
                    logger.error('Error when reading subapp directory: ' + err);
                    return;
                }
                if(stat.isDirectory()) {
                    logger.error('Found subapp: ' + name);
                    counter++;
                    //logger.info('counter: ' + counter);
                    walk([name, 'app', 'templates'].join('/'), ctx, loadTmpl,
                    function () {
                        counter--;
                        //logger.info('counter: ' + counter);
                        if (counter === 0) {
                            callback();
                        }
                    });
                }
            });
        });
    });


};
