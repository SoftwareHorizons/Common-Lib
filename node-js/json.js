function isJsonValid(jsonString) {
    try {
        var a
        a = JSON.parse(jsonString)
        return true;
    } catch (error) {
        return false;
    }
}

exports.isJsonValid = isJsonValid;