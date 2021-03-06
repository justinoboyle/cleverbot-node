var crypto = require('crypto')
    , http = require('http')
    , Cleverbot = function () {
        this.params = Cleverbot.default_params;
    };

Cleverbot.default_params = {
    'stimulus': '', 'start': 'y', 'sessionid': '',
    'vText8': '', 'vText7': '', 'vText6': '',
    'vText5': '', 'vText4': '', 'vText3': '',
    'vText2': '', 'icognoid': 'wsf', 'icognocheck': '',
    'fno': '0', 'prevref': '', 'emotionaloutput': '',
    'emotionalhistory': '', 'asbotname': '', 'ttsvoice': '',
    'typing': '', 'lineref': '', 'sub': 'Say',
    'islearning': '1', 'cleanslate': 'false',
};
Cleverbot.parserKeys = [
    'message', 'sessionid', 'logurl', 'vText8',
    'vText7', 'vText6', 'vText5', 'vText4',
    'vText3', 'vText2', 'prevref', '',
    'emotionalhistory', 'ttsLocMP3', 'ttsLocTXT', 'ttsLocTXT3',
    'ttsText', 'lineref', 'lineURL', 'linePOST',
    'lineChoices', 'lineChoicesAbbrev', 'typingData', 'divert'
];
Cleverbot.digest = function (body) {
    var m = crypto.createHash('md5');
    m.update(body)
    return m.digest('hex');
};

Cleverbot.encodeParams = function (a1) {
    var u = [];
    for (x in a1) {
        if (a1[x] instanceof Array)
            u.push(x + "=" + encodeURIComponent(a1[x].join(",")));
        else if (a1[x] instanceof Object)
            u.push(params(a1[x]));
        else
            u.push(x + "=" + encodeURIComponent(a1[x]));
    }
    return u.join("&");
};

Cleverbot.cookies = {};

Cleverbot.prepare =  function (callback) {
    var options = {
        host: 'www.cleverbot.com',
        port: 80,
        path: '/',
        method: 'GET'
    };
    var req = http.request(options, function (res) {
        res.on('data', function (chunk) {});
          if (res.headers && res.headers["set-cookie"]) {
            var list = res.headers["set-cookie"];
            for (var i = 0; i < list.length; i++) {
              var single_cookie = list[i].split(";");
              var current_cookie = single_cookie[0].split("=");
              Cleverbot.cookies[current_cookie[0]] = current_cookie[1];
            }
            callback(Cleverbot.cookies);
          }
    });
    req.end();
};

Cleverbot.prototype = {

    write: function (message, newCookies, callback) {
        var cookiesToUse = newCookies || Cleverbot.cookies;
        var clever = this;
        body = this.params;
        body.stimulus = message;
        body.icognocheck = Cleverbot.digest(Cleverbot.encodeParams(body).substring(9, 35));
        var cookie_string = '';

        var cookie_tmp = [];
        for (var key in cookiesToUse) {
            if (cookiesToUse.hasOwnProperty(key)) {
                var val = cookiesToUse[key];
                cookie_tmp.push(key + "=" + val);
            }
        }
        cookie_string += cookie_tmp.join(';');

        var options = {
            host: 'www.cleverbot.com',
            port: 80,
            path: '/webservicemin?uc=165&',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Cleverbot.encodeParams(body).length,
                'Cache-Control': 'no-cache',
                'Cookie': cookie_string
            }
        };
        var req = http.request(options, function (res) {
            var cb = callback || function () {
                };
            res.on('data', function (chunk) {
                var chunk_data = chunk.toString().split("\r")
                    , responseHash = {};
                for (var i = 0, iLen = chunk_data.length; i < iLen; i++) {
                    clever.params[Cleverbot.parserKeys[i]] = responseHash[Cleverbot.parserKeys[i]] = chunk_data[i];
                }
                cb(responseHash);
            });
        });
        req.write(Cleverbot.encodeParams(body));
        req.end();
    }

};

module.exports = Cleverbot;
