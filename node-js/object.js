"use strict";
module.exports = {
    isNull: function (data) {
        if (data == undefined || data == null)
            return true;
        else
            return false;
    },
    isNullOrEmpty: function (data) {
        if (data == undefined || data == '' || data == null)
            return true;
        else
            return false;
    },
}