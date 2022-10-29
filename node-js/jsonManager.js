module.exports = {
    add: function (jsonArray, element) {
        var index = 0;
        var newarray = [];

        try {
            for (index = 0; true; index++) {
                if (jsonArray[index] != null)
                    newarray.push(jsonArray[index]);
                else break;
            }
        }
        catch {

        }
        newarray.push(element);
        return newarray;
    },
    remove: function (jsonArray, index) {
        var ind = 0;
        var newarray = [];

        try {
            for (ind = 0; true; ind++) {
                if (jsonArray[ind] != null && ind != index)
                    newarray.push(jsonArray[ind]);
                else if (jsonArray[ind] == null)
                    break;
            }
        }
        catch {

        }

        return newarray;
    }
};


