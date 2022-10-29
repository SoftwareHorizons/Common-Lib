const fs = require('fs')

module.exports = {
    read: function (file) {
        try {
            const data = fs.readFileSync(file, 'utf8')
            return data;
        } catch (err) {
            console.error(err)
            return "";
        }
    },

    write: function (file, data) {
        try {
            fs.writeFileSync(file, data)
            return true
        } catch (err) {
            console.error(err)
            return false
        }
    },

    append: function (file, data) {
        try {
            fs.appendFileSync(file, data);
        } catch (err) {
            console.error(err)
        }
    },

    copy: function (source, end) {
        try {
            fs.copyFileSync(source, end);
        } catch (err) {
            console.error(err)
        }
    },

    delete: function (source) {
        try {
            fs.rmSync(source);
        } catch (err) {
            console.error(err)
        }
    },

    exists: function (path) {
        return fs.existsSync(path)
    },

    getSimilarFile: function (path, search) {
        var files = fs.readdirSync(path);
        var result = null;
        for (let index = 0; index < files.length; index++) {
            if (files[index].includes(search)) {
                result = files[index];
            }
        }
        return result;
    },

    getFilesOnFolder: function (path) {
        var files = fs.readdirSync(path);
        return files;
    },

    rename: function (path, oldname, newname) {
        try {
            fs.renameSync(path + '/' + oldname, path + '/' + newname);
        } catch (err) {
            console.error(err)
        }
    },

};
