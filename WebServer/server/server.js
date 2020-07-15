var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io')(http, { path: '/socket.io' }),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    path = require('path'),
    config = require('./config'),
    dan2 = require('./dan2'),
    utils = require('./utils');

var player_dict = {};
var playing_socket = undefined;

/*** idf_list ***/
function push(idf_name, data) {
    dan2.push(idf_name, data);
    console.log("[da] push", idf_name, data)
}

/*** odf_list ***/
function pull(data) {
    let json_data = JSON.parse(data);
    // console.log("[da] pull data", json_data);
    switch (json_data.op) {
        case "PlayRes": //3
            if (json_data.play_uuid == json_data.uuid) {
                //new player
                playing_socket = player_dict[json_data.uuid];
            }

            player_dict[json_data.uuid].emit('PlayRes', {
                play_uuid: json_data.play_uuid,
                groupList: json_data.groupList
            });
            // modified 2019/12/03
            player_dict[json_data.uuid].emit("Timer", json_data.expired_time);
            break;
        case "MemberRes": //5
            if (playing_socket != undefined) {
                playing_socket.emit("MemberRes", json_data.data);
            }
            break;
        case "Loading": //7
            if (playing_socket != undefined) {
                playing_socket.emit("Loading", json_data.data);
            }
            break;
        case "DisplayFinish": //9
            if (playing_socket != undefined) {
                playing_socket.emit("DisplayFinish", json_data.data);
            }
            break;
        default:
            break;
    }
}

/*** register to IoTtalk ***/
function on_signal(cmd, param) {
    console.log('[da] [cmd]', cmd, param);
    return true;
}

function on_data(odf_name, data) {
    console.log('[da] [data]', odf_name, data);
    switch (odf_name) {
        case "PlayAck-O":
            pull(data);
            break;
        default:
            break;
    }
}

function init_callback(result) {
    console.log('[da] register:', result);
}

dan2.register(config.IoTtalk_URL, {
    'name': config.device_name,
    'on_signal': on_signal,
    'on_data': on_data,
    'idf_list': [
        ['Play-I', ['g']],
        ['Name-I', ['g']],
        ['Wrong', ['g']],
        ['Correct', ['g']],
        ['Acceleration', ['g', 'g', 'g']],
    ],
    'odf_list': [
        ['PlayAck-O', ['g']],
    ],
    'profile': {
        'model': 'PGSmartphone',
    },
    'accept_protos': ['mqtt'],
}, init_callback);

/*** socket.io ***/
const nsp = io.of('/');
nsp.on('connection', function (socket) {
    //1
    socket.on("PlayReq", function (msg) {
        if (!player_dict.hasOwnProperty(msg)) {
            console.log("[server] add Player", msg);
            player_dict[msg] = socket;
        }
        console.log("[ws] PlayReq", msg);

        //2
        push('Play-I', [JSON.stringify({ op: "PlayReq", uuid: msg })]);
    });

    //4 //6
    socket.on("Name-I", function (msg) {
        console.log("[ws] Name-I", msg);
        push('Name-I', [JSON.stringify(msg)]);
    });

    //8
    socket.on("Correct", function (msg) {
        push('Correct', ["1"]);
    });
    //8
    socket.on("Wrong", function (msg) {
        push('Wrong', ["1"]);
    });
    //8
    socket.on("Acceleration", function (msg) {
        push('Acceleration', msg);
    });
    //ws disconnect
    socket.on("disconnect", function (msg) {
        for (let uuid in player_dict) {
            if (player_dict[uuid] == socket) {
                if (player_dict[uuid] == playing_socket) {
                    console.log("[ws] Leave", msg);
                    push("Play-I", [JSON.stringify({ op: "Leave", uuid: uuid })]);
                    playing_socket = undefined;
                }

                console.log("[server] delete Player", uuid);
                delete player_dict[msg];
            }
        }
    });
});

//static files
app.use(express.static("../web"));
app.use(express.static(path.join(__dirname, '../web/frame/build')));
app.use(bodyParser.urlencoded({ extended: true, }));
app.use(bodyParser.json());

// server start
console.log('[server] start');
http.listen((process.env.PORT || config.webServerPort), '0.0.0.0');

/* web page */
app.get("/game", function (req, res) {
    fs.readFile("../web/html/index.html", function (err, contents) {
        if (err) { console.log(err); }
        else {
            contents = contents.toString('utf8');
            utils.sendResponse(res, 200, contents);
        }
    });
});

app.get("/endPage", function (req, res) {
    fs.readFile("../web/html/endPage.html", function (err, contents) {
        if (err) { console.log(err); }
        else {
            contents = contents.toString('utf8');
            utils.sendResponse(res, 200, contents);
        }
    });
});

app.get("/frame", function (req, res) {
    fs.readFile("../web/frame/build/index.html", function (err, contents) {
        if (err) { console.log(err); }
        else {
            contents = contents.toString('utf8');
            utils.sendResponse(res, 200, contents);
        }
    });
})
