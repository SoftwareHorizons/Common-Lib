"use strict";

const logger = require('./logger');
var object = require('./object.js');
const { MongoClient, ServerApiVersion } = require('mongodb');


function connect(uri) {
    return new Promise(function (resolve, reject) {
        try {
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
            client.connect(err => {
                console.log(err);
                resolve(client);
            });
        }
        catch {
            console.log(error);
            reject(new Error(err));
        }
    })
};

function disconnect(client) {
    return new Promise(function (resolve, reject) {
        try {
            client.close();
            resolve(true)
        } catch (error) {
            console.log(error);
            reject(new Error(err));
        }
    });
};

function query(client, dbname, document) {
    return new Promise(function (resolve, reject) {
        try {
            resolve(client.db(dbname).collection(document));
        } catch (error) {
            console.log(error);
            reject(new Error(err));
        }
    });
}


exports.connect = connect;
exports.disconnect = disconnect;
exports.query = query;
