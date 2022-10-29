module.exports = {
    generateRandomKey: function (lenght) {
        var result = "";
        for (var i = 0; i < lenght; i = result.length) {
            result += String.fromCharCode(getRandomArbitrary(48, 122));
            result = result.replace("\\", "");
            result = result.replace("\"", "");
            result = result.replace("\\", "");
            result = result.replace(";", "");
            result = result.replace("`", "");
            result = result.replace("'", "");
        }
        return result;
    }
};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}