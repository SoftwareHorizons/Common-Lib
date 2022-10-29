

function splitWithmultiplespace(text) {
    var lines = text.split('\r\n')
    var result =
    {
        line: []
    }
    lines.forEach(line => {
        var col = []
        var chars = line.split('')
        var spaceCount = 0;

        var string = ''
        chars.forEach(char => {
            if (char == ' ')
                spaceCount++;
            else {
                if (spaceCount >= 2) {
                    col.push(string.trim())
                    string = ""
                }
                spaceCount = 0;
            }
            string += char;

        });

        if (string.trim().length > 0)
            col.push(string.trim())

        result.line.push(col)
    });
    return result;
}


function splitFixedLength(text, arrayBlockSize) {
    var lines = text.split('\r\n')
    var result = {
        line: []
    }

    lines.forEach(line => {
        var col = []
        var chars = line.split('')
        var blockIndex = 0;
        var charIndex = 1;
        var string = ''

        if (arrayBlockSize.length > 0) {
            chars.forEach(char => {
                if (charIndex > arrayBlockSize[blockIndex]) {
                    col.push(string.trim());
                    charIndex = 1;
                    string = '';
                    if (arrayBlockSize.length > blockIndex)
                        blockIndex++;
                }
                string += char;
                charIndex++;
            });
            if(col.length>0)
            result.line.push(col)
        }
        else
            result.line.push(line.trim())


    });
    return result;
}


exports.splitFixedLength = splitFixedLength;
exports.splitWithmultiplespace = splitWithmultiplespace;