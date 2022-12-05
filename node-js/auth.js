"use strict";
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
    try {
        if (!object.isNullOrEmpty(req.body.data.username)) {
            if (object.isNullOrEmpty(req.body.data.password)) // avoid crash for c# api
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
            res.status(401).json({
                message: "Login failed username null"
            });
        }
    } catch (error) {
        var message = error + "\n" + error.stack
        logger.error("auth.js", message);
        res.status(500).json({});
    }

}
exports.logout = async (req, res, next) => {
    try {
        var data = sessionManager.remove(req.body.token)
        if (data != {}) {
            logger.info("auth.js", "User " + data.username + " successfully logged out.")
            managerCookie.createCookie(res, "token", ""); // add token to the cookie page
            res.status(200).json({
                message: "Successfully logged out"
            });
        }
        else {
            logger.warning("auth.js", "Unable to remove session");
            managerCookie.createCookie(res, "token", ""); // add token to the cookie page
            res.status(400).json({
                message: "Error during logged out"
            });
        }
    } catch (error) {
        var message = error + "\n" + error.stack
        logger.error("auth.js", message);
        res.status(401).json({});
    }

}
exports.renewSession = async (req, res, next) => {

    try {
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
    } catch (error) {
        var message = error + "\n" + error.stack
        logger.error("auth.js", message);
        res.status(401).json({});
    }

}
exports.isUserAuthenticated = async (req, res, next) => {
    try {
        var token = req.body.token
        if (token != "")
            getDataUserFromToken(token, function (userData) {
                if (userData.result == "OK") {
                    res.locals.userData = userData.data;
                    next();
                }
                else {
                    try {
                        logger.warning("auth.js", "Unable to get userdata for " + userData.data.userid);
                    } catch (error) {
                        logger.warning("auth.js", "Unable to get userdata from token");
                    }

                    res.status(400).json({});
                }

            });
        else {
            logger.warning("auth.js", "Token invalid");
            res.status(401).json({});
        }

    } catch (error) {
        var message = error + "\n" + error.stack
        logger.error("auth.js", message);
        res.status(401).json({});
    }

}

exports.RequestGetUserData = async (req, res, next) => {
    try {
        var token = req.body.token
        if (token != "")
            getDataUserFromToken(token, function (userData) {
                if (userData.result == "OK") {
                    logger.info("auth.js", "User " + userData.data.username + " request his data");
                    res.status(200).json(maskPassword(userData.data));
                }
                else {
                    try {
                        logger.warning("auth.js", "Unable to get userdata for " + userData.data.userid);
                    } catch (error) {
                        logger.warning("auth.js", "Unable to get userdata");
                    }

                    res.status(400).json({});
                }
            })
    } catch (error) {
        var message = error + "\n" + error.stack
        logger.error("auth.js", message);
        res.status(500).json({});
    }

}

exports.changePassword = async (req, res, next) => { // old, new
    try {
        var userdata = res.locals.userData;
        var requestData = req.body.data
        if (userdata.passw == requestData.old) {
            if (requestData.new.length >= MIN_PASSWORD_LENGTH && userdata.passw != requestData.new) {
                logger.warning("auth.js", "User " + userdata.username + " change his password");
                var newpass = crypter.crypt(requestData.new, KEY);
                var query = `
            UPDATE [dbo].[UserData]
               SET [Password] = '${newpass}'
             WHERE UserID = ${userdata.userid}`

                SQL.singleQuery(connectionOptions, query)
                    .then(function (r) {
                        res.status(200).json({});
                    }).catch(function (err) {
                        res.status(500).json({});
                    })
            }
            else if (userdata.passw == requestData.new)
                res.status(400).json({ message: "The new password cannot match the old one" });
            else
                res.status(400).json({ message: "New password length invalid! (min " + MIN_PASSWORD_LENGTH + ")" });
        }
        else {
            logger.warning("auth.js", "Someone tried to change password!");
            res.status(401).json({ message: "Error" });
        }
    } catch (error) {
        var message = error + "\n" + error.stack
        logger.error("auth.js", message);
        res.status(500).json({});
    }

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

exports.getListUsersIDs = async (req, res, next) => {
    var query = `SELECT *
        FROM [dbo].[UserData]
        `;
    SQL.singleQuery(connectionOptions, query)
        .then(function (result) {
            var list = []
            var SQLParser = require('./SQLParser');
            SQLParser.loadSQLResult(result.line, result.columnTitle);

            for (let index = 0; index < result.line.length; index++) {
                list.push(SQLParser.getParameterFromLine(index, "UserID"));
            }


            res.locals.userList = list;
            next();
        }).catch(function (err) {
            res.status(500).json({});
        })
}

exports.addUser = async (req, res, next) => {
    var userdata = res.locals.userData;
    logger.info("auth.js", "User " + userdata.username + " add a new user.");

    addUser(req.body.data, function (resp) {
        if (resp == 1) {
            logger.info("auth.js", "User " + userdata.username + " added user " + req.body.data.username);
            res.status(200).json({});
        }
        else if (resp == 0)
            res.status(500).json({});
        else
            res.status(400).json({});
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


function isOnGroup(userData, groupName) {
    return userData.group.split(',').includes(groupName);
}
exports.isOnGroup = isOnGroup;


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
    if (!object.isNullOrEmpty(username)) //utente forse è registrato
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

    if (!object.isNullOrEmpty(token)) //se il token non è nullo
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
    if (!object.isNullOrEmpty(usrid) || usrid == 0) //utente forse è registrato
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


function addUser(data, callback) {

    if (!object.isNullOrEmpty(data.username) && !object.isNullOrEmpty(data.name) && !object.isNull(data.surname) && !object.isNull(data.password) && !object.isNullOrEmpty(data.group)) {

        usernameAlreadyExists(data.username, function (exist) {
            if (!exist) {
                var newpass = crypter.crypt(data.password, KEY);
                var query = `INSERT INTO [dbo].[UserData]
                ([Username],[Name],[Surname],[Password],[Group])
            VALUES ('${data.username}','${data.name}','${data.surname}','${newpass}','${data.group}')`

                SQL.singleQuery(connectionOptions, query)
                    .then(function (result) {
                        callback(1);
                    })
                    .catch(function (err) {
                        logger.error("auth.js", err);
                        callback(0);
                    })
            }
            else {
                logger.error("auth.js", "User already exist!");
                callback(-1);
            }
        })

    }
    else {
        logger.error("auth.js", "Unable to add user. data missed");
        callback(-2);
    }


}


function usernameAlreadyExists(username, callback) {
    var query = `SELECT * 
            FROM [dbo].[UserData] 
            where CONVERT(NVARCHAR(MAX), Username)='${username}'
            `;

    SQL.singleQuery(connectionOptions, query)
        .then(function (result) {
            if (result.line.length >= 1)
                callback(true);
            else
                callback(false);
        })
        .catch(function (err) {
            logger.error("auth.js", err);
            //callback(false);
            throw err;
        })
}

