"use strict";

var object = require('./object.js');
var logger = require('./logger.js');
var crypter = require('./crypter');

var settings = {
    keyToken: "",
    timeoutSession: 300,
}



module.exports = {
    init: function (keyToken, timeoutSessionSec = 300) {
        settings = {
            keyToken: keyToken,
            timeoutSession: Number(timeoutSessionSec),
        }
    },
    add: function (userid, name = "Unknown") {
        return generateNewSession(userid, name);
    },
    renew: function (token) {
        return renewSessionFn(token)
    },
    get: function (token) {
        return getUserIDFromToken(token);
    },
    remove: function (token) {
        try {
            var data = JSON.parse(crypter.decrypt(token, settings.keyToken))
            return data;
        } catch (error) {

        }
        return {}
    },
    isSessionExpired: function (token) {
        return isTokenExpired(token)
    },

};


function getUserIDFromToken(token) {

    if (!object.isNullOrEmpty(token) && token.length>0) //se il token non è nullo
    {
        try {
            var data = JSON.parse(crypter.decrypt(token, settings.keyToken))
            return data.userid;
        } catch (error) {

        }
    }
    else
        logger.warning("sessionManager.js", "Token invalid")

    return -1;
}

function renewSessionFn(token) {
    var newtoken = "";

    if (!isTokenExpired(token)) {
        try {
            var data = JSON.parse(crypter.decrypt(token, settings.keyToken))
            var now = new Date();
            data.lastrequest = now;
            newtoken = crypter.crypt(JSON.stringify(data), settings.keyToken)
        } catch (error) {
            logger.warning("sessionManager.js", "Token invalid: decrypt failed")
            return "";
        }
    }

    return newtoken;
}


function isTokenExpired(token) //controlla che il token non sia scaduto
{
    if (!object.isNullOrEmpty(token) && token.length > 0) //se il token non è nullo
    {
        try {
            var data = JSON.parse(crypter.decrypt(token, settings.keyToken))
            var moment = require('moment');
            moment.locale("it");

            var now = moment(new Date())
            var lastReq = moment(data.lastrequest);

            var duration = moment.duration(now.diff(lastReq))
            var durationSec = duration.as('seconds')
            if (durationSec <= settings.timeoutSession && durationSec >= 0)
                return false;
            else {
                logger.warning("sessionManager.js", "Session expired for " + data.username)
                return true;
            }
        } catch (error) {
            logger.warning("sessionManager.js", "Token invalid: decrypt failed")
            return true;
        }
    }
    else
        logger.warning("sessionManager.js", "Token invalid: token is null or empty")


    return true;
}


function generateNewSession(userid, username) {
    if (!object.isNullOrEmpty(String(userid))) {
        var now = new Date();
        var data = {
            userid: userid,
            username: username,
            creationDate: now,
            lastrequest: now,
            oldToken: ""
        };

        var token = crypter.crypt(JSON.stringify(data), settings.keyToken)
        return token
    }
    else
        logger.warning("sessionManager.js", "Invalid userid unable to create token")
    return "";
}
