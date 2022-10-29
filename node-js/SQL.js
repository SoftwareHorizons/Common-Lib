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


function query(query, connection) {
    if (!object.isNull(query))
        return new Promise(function (resolve, reject) {
            try {
                var result = [];

                var resultValue = {
                    columnTitle: [],
                    line: []
                };
                // If no error, then good to go...
                const request = new Request(query, function (err, rowCount, rows) {
                    //logger.log('Numero righe ' + rowCount)
                    if (err) {
                        //console.log(err);
                        reject(new Error("Request error " + err));
                    }
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

                /* request.on('columnMetadata', function (columns) {
                    var columnsName = []
                    columns.forEach(element => {
                        columnsName.push(element.colName)
                    });
                    resultValue.columnTitle = columnsName
                }); */

                connection.on('error', function (error) {
                    logger.error("SQL.js", error)
                    reject(new Error(error));
                });

                request.setTimeout(0);
                connection.execSql(request);
            }
            catch (err) {
                logger.error("SQL.js", err)
                reject(new Error(err));
            }


        });
    else
        return new Promise(function (resolve, reject) {
            logger.error("SQL.js", "Query cannot be null")
            var resultValue = {
                columnTitle: [],
                line: []
            };
            resolve(resultValue)
        })
}


//experimental

function singleQuery(conn, queryData) {
    return new Promise(function (resolve, reject) {
        try {
            connect(conn).then(function (connectionData) {
                query(queryData, connectionData).then(function (result) {
                    disconnect(connectionData).then(function () {
                        if (!object.isNull(result))
                            resolve(result)
                        else
                            resolve(null)
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

exports.singleQuery = singleQuery;
exports.connect = connect;
exports.disconnect = disconnect;
exports.query = query;
