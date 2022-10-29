module.exports = {
    isNull: function (data) {
        if (data == undefined || data == '' || data == null)
            return true;
        else
            return false;
    },
}