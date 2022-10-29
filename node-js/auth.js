var object = require('./object.js');
var logger = require('./logger.js');
var SQL = require('./SQL.js');
var sessionManager = require("./sessionManager.js");
var managerCookie = require('./managerCookie.js');
var managerFiles = require('./managerFiles.js');
var crypter = require('./crypter');

var KEY = `gyg8gsd5788u09op0iig565r56e54xwzqw23wy98u90i0`
var MIN_PASSWORD_LENGTH = 0

sessionManager.init(30, 60, true, 300);

var connectionOptions = {}
//#region AUTH
exports.login = async (req, res, next) => { // TODO sistemare login failed per token scaduto
    if (!object.isNull(req.body.data.username)) {
        if (object.isNull(req.body.data.password)) // avoid crash for c# api
            req.body.data.password = ""

        getDataUser(req.body.data.username, req.body.data.password, function (userData) {
            if (userData.result == "OK") {
                var token = sessionManager.add(userData.data.userid, userData.data.username);

                if (!sessionManager.isSessionExpired(token)) {
                    logger.info("auth.js", "Login from " + userData.data.username + " Status: SUCCEDEED");
                    managerCookie.createCookie(res, "token", token);
                    res.status(200).json({
                        message: "login succeeded",
                        token: token
                    });
                } else {
                    logger.warning("auth.js", "Login from " + userData.data.username + " Status: unable to retrive token")
                    managerCookie.createCookie(res, "token", "");
                    res.status(401).json({
                        message: "Unable to retrive token",
                        token: token
                    });
                }
            }
            else {
                logger.warning("auth.js", "Login from " + req.body.data.username + " Status: Invalid userid or password")
                managerCookie.createCookie(res, "token", "");
                res.status(401).json({
                    message: "Invalid userid or password"
                });
            }
        })
    } // Auth from usr and passw{}
    else {
        logger.warning("auth.js", "Login from " + req.body.data.username + " Status: Invalid userid or password")
        managerCookie.createCookie(res, "token", "");
        res.status(400).json({
            message: "Login failed username null"
        });
    }
}
exports.logout = async (req, res, next) => {
    var userIdLoggedOut = sessionManager.remove(req.body.token)
    if (userIdLoggedOut >= 0) {
        logger.info("auth.js", "User " + userIdLoggedOut + " successfully logged out.")
        managerCookie.createCookie(res, "token", ""); // add token to the cookie page
        res.status(200).json({
            message: "Successfully logged out"
        });
    }
    else {
        logger.warning("auth.js", "Unable to remove session for " + req.body.token);
        managerCookie.createCookie(res, "token", ""); // add token to the cookie page
        res.status(400).json({
            message: "Error during logged out"
        });
    }
}
exports.renewSession = async (req, res, next) => {
    var token = sessionManager.renew(req.body.token);
    if (!sessionManager.isSessionExpired(token)) {
        managerCookie.createCookie(res, "token", token); // add token to the cookie page
        res.status(200).json({ token: token });
    }
    else {
        //logger.warning("auth.js", "Renew token failed for " + req.body.token);
        managerCookie.createCookie(res, "token", ""); // add token to the cookie page
        res.status(401).json({
            message: "Unable to renew session token null"
        }); // remove token to the cookie page
    }
}
exports.isUserAuthenticated = async (req, res, next) => {
    var token = req.body.token
    if (token != "")
        getDataUserFromToken(token, function (userData) {
            if (userData.result == "OK") {
                res.locals.userData = userData.data;
                next();
            }
            else {
                logger.warning("auth.js", "Unable to get userdata for " + userData.data.userid);
                res.json(400).json({});
            }
            /*          if (!object.isNull(userData)) {
                         
                     }
                     else {
                         logger.warning("Unable to get userdata for " + userData.userid, "auth.js");
                         res.status(401).json({});
                     } */
        });
    else {
        logger.warning("Token invalid", "auth.js");
        res.status(401).json({});
    }

},
    exports.RequestGetUserData = async (req, res, next) => {
        var token = req.body.token
        if (token != "")
            getDataUserFromToken(token, function (userData) {
                if (userData.result == "OK") {
                    logger.info("auth.js", "User " + userData.data.username + " request his data");
                    res.status(200).json(maskPassword(userData.data));
                }
                else {
                    logger.warning("auth.js", "Unable to get userdata for " + userData.data.userid);
                    res.json(400).json({});
                }
            })
    }


exports.clearSession = function () {
    sessionManager.clear();
}

exports.init = function (pathConfig, CryptKey, minPasswLength) {
    connectionOptions = JSON.parse(managerFiles.read(pathConfig))
    KEY = CryptKey;
    MIN_PASSWORD_LENGTH = minPasswLength;
}

exports.initWithJson = function (jsonConfig) {
    connectionOptions = jsonConfig
}

exports.maskSensitiveData = function (datajs) {
    return maskPassword(datajs)
}

exports.getListUsersIDs = function (callback) {
    var query = `SELECT *
        FROM [dbo].[UserData]
        `;
    SQL.singleQuery(connectionOptions, query)
        .then(function (result) {
            var list = []
            var SQLParser = require('./SQLParser')
            SQLParser.loadSQLResult(result.line, result.columnTitle)

            for (let index = 0; index < result.line.length; index++) {
                list.push(SQLParser.getParameterFromLine(index, "UserID"))
            }

            callback({
                result: "OK",
                data: list
            })
        }).catch(function (err) {
            callback({
                result: "ERROR",
                msg: err
            })
        })
}


exports.getUserIDFromUsername = function (username, callback) {
    var query = `
        SELECT   [UserID]
                ,[Username]
        FROM [dbo].[UserData]
        WHERE CONVERT(NVARCHAR(MAX),Username)='${username}'
    `;//userdata

    SQL.singleQuery(connectionOptions, query)
        .then(function (result) {
            if (result.line.length == 1) {
                var SQLParser = require('./SQLParser')
                SQLParser.loadSQLResult(result.line, result.columnTitle)
                callback({
                    result: "OK",
                    data: SQLParser.getParameterFromLine(0, "UserID")
                });
            }
            else {
                logger.error("auth.js", "Unable to retrive userid");
                callback({
                    result: "ERROR",
                    msg: "User not found"
                });
            }
        })
        .catch(function () {
            callback({
                result: "ERROR",
                msg: "Unable to connect to db"
            })
        })

}

//#endregion



function convertQueryUserTojson(queryResult) {
    try {
        if (queryResult.line.length == 1) {
            var SQLParser = require('./SQLParser')
            SQLParser.loadSQLResult(queryResult.line, queryResult.columnTitle)

            var password = crypter.decrypt(SQLParser.getParameterFromLine(0, "Password"), KEY)

            var response = {
                userid: Number(SQLParser.getParameterFromLine(0, "UserID")),
                username: SQLParser.getParameterFromLine(0, "Username"),
                passw: password,
                name: SQLParser.getParameterFromLine(0, "Name"),
                surname: SQLParser.getParameterFromLine(0, "Surname"),
                group: SQLParser.getParameterFromLine(0, "Group"),
            }
            return {
                result: "OK",
                data: response
            };
        }
        else
            return {
                result: "ERROR",
                msg: "no data input"
            }


    } catch (err) {
        return {
            result: "ERROR",
            msg: err
        }
    }

}

function maskPassword(datajs) {
    const { passw, ...newObj } = datajs;
    return newObj;
}

function getDataUser(username, password, callback) {
    if (!object.isNull(username)) //utente forse è registrato
    {
        var query = `SELECT * 
            FROM [dbo].[UserData] 
            where CONVERT(NVARCHAR(MAX), Username)='${username}'
            `;
        SQL.singleQuery(connectionOptions, query)
            .then(function (result) {
                var SQLParser = require('./SQLParser')
                SQLParser.loadSQLResult(result.line, result.columnTitle)

                if (result != null) {
                    if (result.line.length == 1) {
                        var passw = crypter.decrypt(SQLParser.getParameterFromLine(0, "Password"), KEY)
                        if (passw.length >= MIN_PASSWORD_LENGTH) {
                            if (passw != password)
                                callback({
                                    result: "ERROR",
                                    msg: "Password not match"
                                })
                            else {
                                var userData = convertQueryUserTojson(result)
                                if (userData.result == "OK")
                                    callback({
                                        result: "OK",
                                        data: userData.data
                                    })
                                else
                                    callback({ result: "ERROR", msg: userData.msg })
                            }
                        }
                        else {
                            logger.error("auth.js", "Min password length found!")
                            callback({ result: "ERROR", msg: "Min password length found" })
                        }
                    }
                    else
                        callback({ result: "ERROR", msg: "User not found" });
                }
                else
                    callback({
                        result: "ERROR",
                        msg: "User not found"
                    });

            }).catch(function (err) {
                logger.error("auth.js", err)
                callback({
                    result: "ERROR",
                    msg: "Unable to connect to db"
                });
            })
    }
}

function getDataUserFromToken(token, callback) {

    if (!object.isNull(token)) //se il token non è nullo
    {
        var userid = sessionManager.get(token);
        if (!sessionManager.isSessionExpired(token)) {
            getDataUserFromUsrId(userid, function (userdata) {
                callback({
                    result: "OK",
                    data: userdata.data
                })
            });
        }
        else {
            callback({
                result: "ERROR",
                msg: "Session expired or not valid"
            });
        }
    }
    else {
        callback({
            result: "ERROR",
            msg: "Session not valid"
        });

    }
}

function getDataUserFromUsrId(usrid, callback) {
    if (!object.isNull(usrid) || usrid == 0) //utente forse è registrato
    {
        var query = `SELECT *
        FROM [dbo].[UserData]
        where CONVERT(NVARCHAR(MAX), UserID)=${usrid}
        `;
        SQL.singleQuery(connectionOptions, query)
            .then(function (result) {
                var userData = convertQueryUserTojson(result)
                if (userData.result == "OK")
                    callback({
                        result: "OK",
                        data: userData.data
                    })
                else
                    callback({
                        result: "ERROR",
                        msg: userData.msg
                    })
            })
            .catch(function (err) {
                logger.error("auth.js", err);
                callback({
                    result: "ERROR",
                    msg: err
                })
            })

    } else {
        logger.error("auth.js", "Error in function getDataUserFromUsrId usrid is null");
        callback({
            result: "ERROR",
            msg: "usrid is null"
        })
    }

}

