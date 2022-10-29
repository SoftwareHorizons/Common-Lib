var CryptoJS = require("crypto-js");


module.exports = {
    crypt: function (text, key) {
        return CryptoJS.AES.encrypt(text, key).toString();
    },
    decrypt: function (text, key) {
        var bytes = CryptoJS.AES.decrypt(text, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    },
};