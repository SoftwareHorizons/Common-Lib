var object = require('./object.js');
var logger = require('./logger.js');
var SQL = require('./SQL.js');
var sessionManager = require("./sessionManager.js");
var managerCookie = require('./managerCookie.js');
var managerFiles = require('./managerFiles.js');
var crypter = require('./crypter');

const key = `rq^xPo!BudY%KNycJdAT*t^vQZ*tHm$3*dS%io^aWzt6^aTYxquXFq^2HYS2e4caY9@!#F52VbZUtAjXrULk@3`

sessionManager.init(30, 60, true, 300);

var connectionOptions = {}
//#region AUTH
exports.login = async (req, res, next) => { // TODO sistemare login failed per token scaduto
    if (!object.isNull(req.body.data.username)) {
        if (object.isNull(req.body.data.password)) // avoid crash for c# api
            req.body.data.password = ""

        getDataUser(req.body.data.username, req.body.data.password, function (userData) {
            if (!object.isNull(userData)) {
                var token = sessionManager.add(userData.userid);

                if (!sessionManager.isSessionExpired(token)) {
                    logger.info("Login from userid " + userData.username + " Status: SUCCEDEED", "Authentication.js");
                    managerCookie.createCookie(res, "token", token);
                    res.status(200).json({
                        message: "login succeeded",
                        token: token
                    });
                } else {
                    logger.warning("Login from userid " + userData.username + " Status: unable to retrive token", "Authentication.js")
                    managerCookie.createCookie(res, "token", "");
                    res.status(401).json({
                        message: "Unable to retrive token",
                        token: token
                    });
                }
            }
            else {
                logger.warning("Login from userid " + req.body.data.username + " Status: Invalid userid or password", "Authentication.js")
                managerCookie.createCookie(res, "token", "");
                res.status(401).json({
                    message: "Invalid userid or password"
                });
            }
        })
    } // Auth from usr and passw{}
    else {
        logger.warning("Login from userid " + req.body.data.username + " Status: Invalid userid or password", "Authentication.js")
        managerCookie.createCookie(res, "token", "");
        res.status(400).json({
            message: "Login failed username null"
        });
    }
}
exports.logout = async (req, res, next) => {
    var userIdLoggedOut = sessionManager.remove(req.body.token)
    if (userIdLoggedOut >= 0) {
        logger.info("User " + userIdLoggedOut + " successfully logged out.", "Authentication.js")
        managerCookie.createCookie(res, "token", ""); // add token to the cookie page
        res.status(200).json({
            message: "Successfully logged out"
        });
    }
    else {
        logger.warning("Unable to remove session for " + req.body.token, "Authentication.js");
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
        logger.warning("Renew token failed for " + req.body.token, "Authentication.js");
        managerCookie.createCookie(res, "token", ""); // add token to the cookie page
        res.status(401).json({
            message: "Unable to renew session token null"
        }); // remove token to the cookie page
    }
}
exports.getDataUserFromToken = function (dataAuth, callback) {
    getDataUserFromToken(dataAuth.token, function (userData) {
        if (!object.isNull(userData))
            callback({ status: "SUCCEEDED", data: userData });
        else
            callback({ status: "ERROR" });
    });
}
exports.RequestGetUserData = async (req, res, next) => {
    var token = req.body.token
    if (token != "")
        getDataUserFromToken(token, function (userData) {
            if (!object.isNull(userData)) {
                logger.info("User " + userData.username + " request his data", "Authentication.js");
                res.status(200).json(maskPassword(userData));
            }
            else {
                logger.warning("Unable to get userdata for " + userData.userid, "Authentication.js");
                res.json(400).json({});
            }
        })



}


exports.clearSession = function () {
    sessionManager.clear();
}

exports.init = function (configSql) {
    connectionOptions = JSON.parse(managerFiles.read(configSql))
}





//#endregion



function convertQueryUserTojson(queryResult) {
    try {

        var SQLParser = require('./lib/SQLParser')
        SQLParser.loadSQLResult(queryResult.line, queryResult.columnTitle)
        var password = crypter.decrypt(SQLParser.getParameterFromLine(0, "Password"), key)

        var response = {
            userid: Number(SQLParser.getParameterFromLine(0, "UserID")),
            username: SQLParser.getParameterFromLine(0, "Username"),
            passw: password,
            name: SQLParser.getParameterFromLine(0, "Name"),
            surname: SQLParser.getParameterFromLine(0, "Surname"),
            group: SQLParser.getParameterFromLine(0, "Group"),
        }
        return response;
    } catch (error) {
        return "";
    }

}


exports.getUserIDFromNickName = function (nickname, callback) {
    var query = `
        SELECT   [UserID]
                ,[Username]
        FROM [dbo].[UserData]
        WHERE CONVERT(NVARCHAR(MAX),Username)='${nickname}'
    `;//userdata

    SQL.singleQuery(connectionOptions, query)
        .then(function (result) {
            if (userdata.line.length == 1) {
                callback(userdata);
            }
            else {
                logger.error("Unable to retrive userid", "Authentication.js");
                callback("ERROR");
            }
        })
        .catch(function () {
            callback(null)
        })

}

exports.maskSensitiveData = function (datajs) {
    return maskPassword(datajs)
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
                var SQLParser = require('./lib/SQLParser')
                SQLParser.loadSQLResult(result.line, result.columnTitle)

                if (result != null) {
                    if (result.line.length == 1) {
                        var passw = crypter.decrypt(SQLParser.getParameterFromLine(0, "Password"), key)
                        if (passw.length >= 4) {
                            if (passw != password)
                                callback(null)
                            else
                                callback(convertQueryUserTojson(result))
                        }
                        else {
                            logger.error("Min password length found!","Authentication.js")
                            callback(null)
                        }

                    }
                    else
                        callback(null);
                }
                else
                    callback(null);

            }).catch(function (err) {
                logger.error(err, "Authentication.js")
                callback("ERROR");
            })

    }
    //callback("ERROR")
}


function getDataUserFromToken(token, callback) {

    if (!object.isNull(token)) //se il token non è nullo
    {
        var userid = sessionManager.get(token);
        if (!sessionManager.isSessionExpired(token)) {
            getDataUserFromUsrId(userid, function (userdata) {
                callback(userdata)
            });
        }
        else {
            callback("");
        }
    }
    else {
        callback("");
    }
    //return "";
}



function getDataUserFromUsrId(usrid, callback) {
    if (!object.isNull(usrid)) //utente forse è registrato
    {
        var query = `SELECT *
        FROM [dbo].[UserData]
        where CONVERT(NVARCHAR(MAX), UserID)=${usrid}
        `;
        SQL.singleQuery(connectionOptions, query)
            .then(function (result) {
                callback(convertQueryUserTojson(result))
            })
            .catch(function (err) {
                console.log(err)
            })

    } else {
        logger.error("Error in function getDataUserFromUsrId usrid is null", "Authentication.js");
        callback("ERROR")
    }

}


exports.getListUsers = function (callback) {
    var query = `SELECT *
        FROM [dbo].[UserData]
        `;
    SQL.singleQuery(connectionOptions, query)
        .then(function (result) {
            callback(result.line)
        }).catch(function (err) {
            console.log(err)
        })
}
