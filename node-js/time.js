"use strict";
module.exports = {
    toString: function (format = 0)/*function (datetime, format = "")*/ {
        /*var now = moment(datetime)

        switch (format) {//.toLowerCase()
            case 'YYYY.MM.DD.HH.MM.SS':
                moment.locale("eu");
                return moment().format('L').replace(new RegExp('-', 'g'), '.') + '.' + moment().format('LTS').replace(new RegExp(':', 'g'), '.');
                
            case 'DD.MM.YYYY.HH.MM.SS':
                moment.locale("it");
                return moment().format('L').replace(new RegExp('/', 'g'), '.') + '.' + moment().format('LTS').replace(new RegExp(':', 'g'), '.');
                
            case 'YYYY/MM/DD HH:MM:SS':

                break;
            case 'DD/MM/YYYY HH:MM:SS':

                break;
            case 'YYYY-MM-DD HH:MM:SS':

                break;
            case 'DD-MM-YYYY HH:MM:SS':

                break;


            default:
                break;
        }*/
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



exports.getTimespan = function getTimespan(datetime1, datetime2, locale = "it") {
    var moment = require('moment');
    moment.locale(locale);
    var datetime1T = moment(datetime1)
    var datetime2T = moment(datetime2)

    return moment.duration(datetime1T.diff(datetime2T))
}

exports.convertTimeSpanToSec = function convertTimeSpanToSec(timespan) {
    return timespan.as('seconds');
}