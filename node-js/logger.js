"use strict";
const fs = require('fs');
var datamanager = require('./managerFiles.js');
var time = require('./time.js');
var logPath = './LOG/'
var logName = 'LOG'


module.exports = {
    init: function (path, name) {
        logPath = path;
        logName = name;
    },
    warning: function (channel = "", logtext) {
        makeLog(logtext, 1, channel)
    },
    error: function (channel = "", logtext) {
        makeLog(logtext, 2, channel)
    },
    info: function (channel = "", logtext) {
        makeLog(logtext, 0, channel)
    },
    log: function (channel = "", logtext) {
        makeLog(logtext, 0, channel, false)
    },
};


function makeLog(logtext, type, channel, write = true) {
    var log = time.Date() + '\t' + time.Time() + '\t' + channel + '\t' + getTypeLog(type) + '\t' + logtext;
    var filename = logPath + "/" + logName + "_" + time.Date() + '.log';

    switch (getTypeLog(type)) {
        case "ERRO":
            console.error(log);
            break;

        case "WARN":
            console.warn(log);
            break;

        default:
            console.log(log);
            break;
    }


    if (write) {
        if (!fs.existsSync(logPath)) { //create the log folder if not exists
            fs.mkdirSync(logPath, { recursive: true });
        }
        datamanager.append(filename, log + "\n");
    }

}

function getTypeLog(num) {
    if (num == 1)
        return "WARN"
    else if (num == 2)
        return "ERRO"
    else
        return "INFO"
}


