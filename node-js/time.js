"use strict";
module.exports = {
    provideDate: function (format = 0) {
        const dateVar = new Date();
        var monthCorrect = Number(dateVar.getMonth()) + 1;
        if (format == 0)
            return dateVar.getFullYear() + "." + monthCorrect + "." + dateVar.getDate() + "." + dateVar.getHours() + "." + dateVar.getMinutes() + "." + dateVar.getSeconds();
        else if (format == 1)
            return dateVar.getFullYear() + "/" + monthCorrect + "/" + dateVar.getDate() + " " + dateVar.getHours() + ":" + dateVar.getMinutes() + ":" + dateVar.getSeconds();
        else if (format == 2) {
            return date() + '_' + time(1);
        }
    },
    Date: function () {
        return date();
    },
    Time: function () {
        return time();
    },
    getTimespan: function (datetime1, datetime2) {
        return getTimespan(datetime1, datetime2);
    },
    convertTimeSpanToSec: function (timespan) {
        return convertTimeSpanToSec(timespan);
    },
};


function date() {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    return (year + "-" + month + "-" + date)
}

function time(format = 0) {
    let date_ob = new Date();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    if (format == 0)
        return (twoChar(hours.toString()) + ":" + twoChar(minutes.toString()) + ":" + twoChar(seconds.toString()));
    else
        return (twoChar(hours.toString()) + "-" + twoChar(minutes.toString()) + "-" + twoChar(seconds.toString()));
}

function twoChar(numin) {
    if (numin.length < 2)
        return "0" + numin;
    else
        return numin;
}



function getTimespan(datetime1, datetime2) {
    var diff = datetime2.getTime() - datetime1.getTime();
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);
    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);

    return {
        days: days,
        hours: hours,
        minutes: mins,
        seconds: seconds
    }
}

function convertTimeSpanToSec(timespan) {
    var res = timespan.days * 86400;
    res += timespan.hours * 86400;
    res += timespan.minutes * 60;
    res += timespan.seconds;
    return res;
}