"use strict";
const { TYPES } = require('tedious');
const logger = require('./logger');
var object = require('./object.js');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;



function connect(config) {
    var connection;
    return new Promise(function (resolve, reject) {
        connection = new Connection(config);

        //connection.on('error', reject("Error"));

        connection.connect(function (err) {
            if (err) {
                logger.error("SQL.js", err)
                reject(new Error(err));
            } else {
                resolve(connection)
            }
        });
    })
};

function disconnect(connection) {
    return new Promise(function (resolve, reject) {
        connection.close()
        connection.cancel()

        connection.on('end', function (err) {
            if (err) {
                logger.error("SQL.js", err)
                reject(new Error(err));
            } else {
                resolve()
            }
        });

        connection.on('error', function (err) {
            logger.error("SQL.js", err)
            reject(new Error(err));
        });
        //connection.on('error', reject("Error"))
    });
};

function emptyResult(){
    return {
        columnTitle: [],
        line: []
    };
}

function query(query, connection, param, storedProcedure = false) {
    if (!object.isNullOrEmpty(query))
        return new Promise(function (resolve, reject) {
            try {
                //var storedProcedure = false
                var result = [];

                var resultValue = emptyResult();

                const request = new Request(query, function (err, rowCount, rows) {

                    if (err)
                        reject(new Error("Request error " + err));

                    else if (rows.length > 0 /* && rows.length == rowCount */) {
                        var columnsName = []

                        for (let index = 0; index < rows.length; index++) {
                            result = [];
                            rows[index].forEach(function (column) {//cycle every filed of a row
                                if (column.value === null) {
                                    result.push('NULL');
                                } else {
                                    result.push(column.value);
                                }

                                if (index == 0) {
                                    columnsName.push(column.metadata.colName)
                                }
                            });
                            resultValue.line.push(result);
                            if (index == 0)
                                resultValue.columnTitle = columnsName
                        }

                        resolve(resultValue)
                    }
                    else
                        resolve(resultValue)

                });

                param.inputParam.forEach(element => {
                    request.addParameter(element.name, element.type, element.value)

                    if (element.type == TYPES.TVP)// if table is present change type of execution to stored procedure
                        storedProcedure = true;
                });

                connection.on('error', function (error) {
                    logger.error("SQL.js", error)
                    reject(new Error(error));
                });

                request.setTimeout(0);

                if (!storedProcedure)
                    connection.execSql(request);
                else
                    connection.callProcedure(request);
            }
            catch (err) {
                logger.error("SQL.js", err)
                reject(new Error(err));
            }


        });
    else
        return new Promise(function (resolve, reject) {
            logger.error("SQL.js", "Query cannot be null")
            resolve(emptyResult())
        })
}

function singleQuery(conn, queryData, param = emptyParam(), storedProcedure = false) {
    return new Promise(function (resolve, reject) {
        try {
            connect(conn).then(function (connectionData) {
                query(queryData, connectionData, param, storedProcedure).then(function (result) {
                    disconnect(connectionData).then(function () {
                        if (!object.isNullOrEmpty(result))
                            resolve(result)
                        else
                            resolve(emptyResult())
                    })
                }).catch(function (err) {
                    disconnect(connectionData).then(function () {
                        logger.error("SQL.js", err)
                        reject(new Error(err))
                    })
                })
            })
        } catch (err) {
            logger.error("SQL.js", error)
            reject(new Error(err))
        }
    })
}




//########################## PARAM

function emptyParam() {
    return {
        inputParam: [],
        outputParam: []
    }
}


function addInpParam(param, paramName, paramType, value) {
    param.inputParam.push({ name: paramName, type: paramType, value: value, })
    return param;
}


//########################## TABLE

function emptyTable() {
    return {
        columns: [
        ],
        rows: [
        ]
    }
}

function addTableColumn(table, name, type, length = null) {
    if (length == null)
        table.columns.push({ name: name, type: type })
    else
        table.columns.push({ name: name, type: tye, length: length })
    return table
}

function addTableRow(table, rowDataArray) {
    table.rows.push(rowDataArray)
    return table
}


exports.emptyTable = emptyTable;
exports.addTableColumn = addTableColumn;
exports.addTableRow = addTableRow;

exports.emptyParam = emptyParam;
exports.addInpParam = addInpParam;

exports.singleQuery = singleQuery;
exports.connect = connect;
exports.disconnect = disconnect;
exports.query = query;
