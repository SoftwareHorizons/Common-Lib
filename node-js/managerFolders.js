const fs = require('fs')

function createIfNotExists(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
        return false // not exists
    }
    else
        return true; // exists
}


exports.createIfNotExists = createIfNotExists;