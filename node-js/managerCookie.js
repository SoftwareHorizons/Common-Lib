"use strict";

module.exports = {
    createCookie: function (res, key, value) {
        var cookie = key + "=" + value+ ";SameSite=Lax";//";SameSite=None; Secure"     Secure è per https
        res.setHeader("Set-Cookie", cookie);
        return res;
    },
    parseCookies: function (request) {
        var list = {},
            rc = request.headers.cookie;

        rc && rc.split(';').forEach(function (cookie) {
            var parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });

        return list;
    }
};