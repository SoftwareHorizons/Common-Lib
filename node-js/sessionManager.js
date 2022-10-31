"use strict";
var tokenGenerator = require('./tokenGenerator.js');
var object = require('./object.js');
var logger = require('./logger.js');
var time = require('./time.js');
var dataAuthentications = { sessions: [] };

var settings = {
    tokenLength: 30,
    needRenew: true,
    tokenMaxTimeSec: 300,
    clearDeadSessionTime: 300
}



module.exports = {
    init: function (tokenLength = 30, clearDeadSessionTimeSec = 60, needRenew = false, tokenMaxTimeSec = 300) {
        settings = {
            tokenLength: Number(tokenLength),
            needRenew: needRenew,
            tokenMaxTimeSec: Number(tokenMaxTimeSec),
            clearDeadSessionTime: Number(clearDeadSessionTimeSec)
        }
        if (needRenew)
            setInterval(clear, (Number(clearDeadSessionTimeSec) * 1000)); //pulisce le sessioni ogni 5 min
    },
    add: function (userid, name = "Unknown") {
        return generateNewSession(userid, name);
    },
    renew: function (token) {
        return renewSessionFn(token)
    },
    get: function (token) {
        return getDataUserFromToken(token);
    },
    remove: function (token) {
        return removeSession(token)
    },
    isSessionExpired: function (token) {
        return isTokenExpired(token)
    },

};

exports.clear = clear;

function clear() {
    var session = getSessionLenght();
    if (session > 0) {
        clearDeadSession();
        logger.info("sessionManager.js", "Clear dead sessions...Session cleared: " + (session - getSessionLenght()))
        if (session - getSessionLenght() > 0)
            printActiveSession();
    }
}


function getDataUserFromToken(token) {

    if (!object.isNull(token) && token.length == settings.tokenLength) //se il token non è nullo
    {
        for (var c = 0; c < getSessionLenght(); c++) {
            if (dataAuthentications.sessions[c].token == token) {
                return dataAuthentications.sessions[c].userid;
            }
        }
    }
    else
        logger.warning("sessionManager.js", "Token invalid")
}


function clearDeadSession() {
    for (var i = 0; i < getSessionLenght(); i++) {
        var currtoken = dataAuthentications.sessions[i].token
        if (isTokenExpired(currtoken)) {
            dataAuthentications.sessions.splice(i, 1);
            logger.warning("sessionManager.js", "Session expired for " + dataAuthentications.sessions[i].username)
        }
    }
}

function removeSession(token) {

    if (!object.isNull(token) && token.length == settings.tokenLength) //se il token non è nullo
    {
        for (var c = 0; c < getSessionLenght(); c++) {
            if (dataAuthentications.sessions[c].token == token) {
                var data = dataAuthentications.sessions[c];
                dataAuthentications.sessions.splice(c, 1)
                logger.info("sessionManager.js", "Current sessions active: " + getSessionLenght())
                printActiveSession();
                return data;
            }
        }
        logger.warning("sessionManager.js", "Token not found")
    }
    else
        logger.warning("sessionManager.js", "Token invalid")

    return {};
}

function printListSession(array) {
    var string = ''
    string += '\n | UserID | first Login       | Last Renew        | Activity time     |\n'
    string += ' | ------ | ----------------- | ----------------- | ----------------- |\n'
    var sessionLength = getSessionLenght()
    if (sessionLength == 0)
        string += ' |        |                   |                   |                   |\n'
    else
        for (var c = 0; c < sessionLength; c++) {
            var current = array[c]

            var startStr = current.creationDate.split('.');
            var start = new Date(startStr[0], startStr[1], startStr[2], startStr[3], startStr[4], startStr[5]);
            startStr = current.lastrequest.split('.');
            var end = new Date(startStr[0], startStr[1], startStr[2], startStr[3], startStr[4], startStr[5]);
            var timespan = time.getTimespan(start, end)
            string += ' | ' + current.username + '       | ' + current.creationDate + ' | ' + current.lastrequest + ' | ' + timespan.days + 'dd ' + timespan.hours + 'hh ' + timespan.minutes + 'mm ' + timespan.seconds + 'ss |\n'
        }
    string += ' | ------ | ----------------- | ----------------- | ----------------- |\n'
    console.log(string)
}

function printActiveSession() {
    printListSession(dataAuthentications.sessions)
}

function renewSessionFn(token) {
    var newtoken = "";
    if (settings.needRenew == true) {
        if (!isTokenExpired(token)) {
            for (var c = 0; c < getSessionLenght(); c++) {
                if (dataAuthentications.sessions[c].token == token) {
                    dataAuthentications.sessions[c].lastrequest = time.provideDate();
                    return dataAuthentications.sessions[c].token = generateToken();
                }
            }
        }
    }
    else
        return token;

    return newtoken;
}

function getSessionLenght() {
    /*     var c = 0;
        try {
            while (true) {
                var test = dataAuthentications.sessions[c].lastrequest;
                c++;
            }
        } catch {
            //logger.error("sessionManager.js","Error in function getSessionLenght");
        }
        return c; */
    return dataAuthentications.sessions.length;
}

function generateToken() {
    var ntoken = "";
    var found = false;
    while (!found) { //fino a che non trova un token che non è gia presente
        ntoken = tokenGenerator.generateRandomKey(settings.tokenLength); //genera un token di  caratteri

        found = true;
        for (var c = 0; c < getSessionLenght(); c++) {
            if (dataAuthentications.sessions[c].token == ntoken) {
                found = false;
                break;
            }
        }
    }
    return ntoken;
}


function isTokenExpired(token) //controlla che il token non sia scaduto
{
    if (!object.isNull(token) && token.length == settings.tokenLength) //se il token non è nullo
    {
        for (var c = 0; c < getSessionLenght(); c++) {
            if (dataAuthentications.sessions[c].token == token) {
                if (settings.needRenew == true) {
                    var startStr = dataAuthentications.sessions[c].lastrequest.split('.');
                    var start = new Date(startStr[0], startStr[1], startStr[2], startStr[3], startStr[4], startStr[5]);
                    var now = new Date();
                    var res = time.getTimespan(start, now)

                    if (time.convertTimeSpanToSec(res) <= settings.tokenMaxTimeSec)
                        return false;
                    else {
                        logger.warning("sessionManager.js", "Session expired for " + dataAuthentications.sessions[c].username)
                        return true;
                    }
                }
                else
                    return false;

            }
        }
        logger.warning("sessionManager.js", "Token not found")
    }
    else
        logger.warning("sessionManager.js", "Token invalid")


    return true;
}


function generateNewSession(userid, username) {
    if (!object.isNull(String(userid))) {
        var data = {
            token: generateToken(),
            userid: userid,
            username: username,
            creationDate: time.provideDate(),
            lastrequest: time.provideDate()
        };

        dataAuthentications.sessions.push(data);
        printActiveSession()

        return data.token
    }
    else
        logger.warning("sessionManager.js", "Invalid userid unable to create token")
    return "";
}