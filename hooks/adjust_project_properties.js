#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const adjustments = require('./project_properties_config');

const path = require('path');

module.exports = function (ctx) {
    // ensure `Android` build
    if (ctx.opts.platforms.indexOf('android') < 0 || ctx.cmdLine.indexOf("--skip-adjust-project-properties") != -1) {
        return;
    }

    var platformRoot = path.join(ctx.opts.projectRoot, 'platforms/android');
    var propFilePath = path.join(platformRoot, 'project.properties');
    var Q;
    try {
        Q = require('q');
    } catch (e) {
        Q = context.requireCordovaModule('q');
    }

    var deferral = new Q.defer();


    const rl = readline.createInterface({
        input: fs.createReadStream(propFilePath)
    });

    var outLines = [];

    console.log('Adjusting `project.properties` file.');

    rl.on('line', function (line) {

        var regex = /(cordova.system.library.[\d])=([a-zA-Z.-]+:[a-zA-Z0-9.-]+):([a-zA-Z0-9.+-]+)/;
        var result = line.match(regex);

        if (null === result) {
            outLines.push(line);
        } else {
            var prefix = result[1];
            var name = result[2];
            var version = result[3];

            if (adjustments[name]) {
                console.log('Replace', name, 'from', version, 'to', adjustments[name]);
                outLines.push(prefix + '=' + name + ':' + adjustments[name]);
            } else {
                outLines.push(line);
            }
        }
    });

    rl.on('close', function () {
        console.log('`project.properties` file adjusted. Result lines:');
        console.log(outLines);

        //propFilePath = 'platforms/android/project2.properties'; // for test

        fs.writeFile(propFilePath, outLines.join('\n'), function (err) {
            if (err) {
                deferral.reject(err);
            } else {
                console.log("The file was saved!");
                deferral.resolve();
            }
        });
    });

    return deferral.promise;
};
