"use strict";
const fs = require('fs')

function createIfNotExists(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
        return false // not exists
    }
    else
        return true; // exists
}


function remove(path) {
    if (fs.existsSync(path)) {
        fs.rmSync(path, { recursive: true });
        return true // exists
    }
    else
        return false; // not exists
}


exports.createIfNotExists = createIfNotExists;
exports.remove = remove;