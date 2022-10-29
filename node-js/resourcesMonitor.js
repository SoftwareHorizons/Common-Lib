var exec = require('child_process').exec;


function getRamUsagePerc(windows = true, callback) {
    getRamFree(windows, function (free) {
        getRamTotal(windows, function (total) {
            var usage = total - free;
            var usagePerc = (100 / total) * usage
            usagePerc = Math.round((Number(usagePerc) + Number.EPSILON) * 100) / 100
            callback(usagePerc)
        })
    })

}

function getCpuUsagePerc(windows = true, callback) {
    if (windows) {
        const CPUUSAGE = "wmic cpu get loadpercentage"
        execute(CPUUSAGE, function (result) {
            callback(Number(getSecondLine(result)))
        })
    }
}

function getRamFree(windows = true, callback) {
    if (windows) {
        const USEDRAM = "wmic OS get FreePhysicalMemory"
        execute(USEDRAM, function (result) {
            callback(Number(getSecondLine(result)))
        })
    }
}


function getRamTotal(windows = true, callback) {
    if (windows) {
        const TOTALRAM = "wmic ComputerSystem get TotalPhysicalMemory"
        execute(TOTALRAM, function (result) {
            var total = Number(getSecondLine(result))
            total = total / 1000
            callback(total)
        })
    }
}



function execute(command, callback) {
    exec(command, function (error, stdout, stderr) { callback(stdout); });
};


function getSecondLine(text) {
    var lines = text.split('\r\n')
    if (lines.length >= 2)
        return lines[1]
    else
        return '';
}



function getTaskList(windows = true, callback) {
    if (windows) {
        const PROCESSLIST = "tasklist"//wmic process
        execute(PROCESSLIST, function (result) {
            const str = require('./string')
            callback(str.splitFixedLength(result, [26, 9, 17, 12, 12]))
        })
    }
}


function getProcessList(windows = true, callback) {
    if (windows) {
        const PROCESSLIST = "wmic process"
        execute(PROCESSLIST, function (result) {
            const str = require('./string')
            callback(str.splitWithmultiplespace(result))
        })
    }
}


exports.getProcessList = getProcessList
exports.getTaskList = getTaskList;

exports.getRamUsagePerc = getRamUsagePerc;
exports.getCpuUsagePerc = getCpuUsagePerc;

exports.getRamFree = getRamFree;
exports.getRamTotal = getRamTotal;