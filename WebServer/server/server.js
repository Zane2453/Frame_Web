var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io')(http, {path: '/socket.io'}),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    config = require('./config'),
    daList = {},
    utils = require('./utils');
const request = require('request');

/*** idf_list ***/
function push(p_id, idf_name, data){
    //dan2.push(idf_name, data);
    var options = {
        uri: config.GameServerHost + ":" + config.GameServerPort + "/push",
        method: 'POST',
        json: {
            "p_id": p_id,
            "idf": idf_name,
            "data": data
        }
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("[sys] Push Successfully!");
        }
    });
    console.log("[da] push", p_id, idf_name, data)
}

/*** socket.io ***/
const nsp = io.of('/');
nsp.on('connection', function(socket){
    //1
    socket.on("PlayReq", function(msg){
        if(!daList[msg["p_id"]]["player_dict"].hasOwnProperty(msg)){
            console.log("[server] add Player", msg);
            daList[msg["p_id"]]["player_dict"][msg["uuid"]] = socket;
        }
        console.log("[ws] PlayReq", msg);

        //2
        push(msg["p_id"], 'Play-I', [JSON.stringify({ op: "PlayReq", uuid: msg["uuid"] })]);
    });

    //4 //6
    socket.on("Name-I", function(msg){
        console.log("[ws] Name-I", msg);
        push(msg["p_id"], 'Name-I', [JSON.stringify(msg)]);
    });

    //8
    socket.on("Correct", function(msg){
        push(msg["p_id"], 'Correct', ["1"]);
    });
    //8
    socket.on("Wrong", function(msg){
        push(msg["p_id"], 'Wrong', ["1"]);
    });
    //8
    socket.on("Acceleration", function(msg){
        push(msg["p_id"], 'Acceleration', msg);
    });
    //ws disconnect
    socket.on("disconnect", function(msg){
        for(let p_id in daList){
            for(let uuid in daList[p_id]["player_dict"]){
                if(daList[p_id]["player_dict"][uuid] == socket){
                    if(daList[p_id]["player_dict"][uuid] == daList[p_id]["playing_socket"]){
                        console.log("[ws] Leave", msg);
                        push(p_id, "Play-I", [JSON.stringify({ op: "Leave", uuid: uuid })]);
                        daList[p_id]["player_dict"]["playing_socket"] = undefined;
                    }

                    console.log("[server] delete Player", uuid);
                    delete daList[p_id]["player_dict"][msg];
                }
            }
        }
    });
});

// static files
app.use(express.static("../web"));
app.use(bodyParser.urlencoded({ extended: true, }));
app.use(bodyParser.json());

// server start
console.log('[server] start');
http.listen((process.env.PORT || config.webServerPort), '0.0.0.0');

/* web page */
app.get("/game", function(req, res){
    var p_id = req.query.p_id,
        do_id = req.query.do_id;
    // var p_id = 17,
    //     do_id = 51;
    fs.readFile("../web/html/index.ejs", function(err, contents){
        if(err){ console.log(err); }
        else{
            contents = contents.toString('utf8');
            utils.sendEjsRenderResponse(res, 200, contents, {
                p_id: p_id,
                do_id, do_id
            });
        }
    });
});

app.get("/endPage", function(req, res){
    fs.readFile("../web/html/endPage.html", function(err, contents){
        if(err){ console.log(err); }
        else{
            contents = contents.toString('utf8');
            utils.sendResponse(res, 200, contents);
        }
    });
});

/* APIs */
app.post("/register", function(req, res){
    var p_id = req.body.p_id;
    daList[p_id] = {};
    daList[p_id]["player_dict"] = {};
    daList[p_id]["playing_socket"] = undefined;
    console.log("Add WebServer " + String(p_id) + " Successful!");
    utils.sendResponse(res, 200, "[sys] Successful Register PGSmartphone!");
});

app.post("/deregister", function(req, res){
    var p_id = req.body.p_id;
    delete daList[p_id];
    console.log("Delete WebServer " + String(p_id) + " Successful!");
    utils.sendResponse(res, 200, "[sys] Successful Deregister PGSmartphone!");
});

app.post("/pull", function(req, res){
    var p_id = req.body.p_id;
    let json_data = JSON.parse(req.body.data);
    switch(json_data.op){
        case "PlayRes": //3
            if(json_data.play_uuid == json_data.uuid){
                //new player
                daList[p_id]["playing_socket"] = daList[p_id]["player_dict"][json_data.uuid];
            }

            daList[p_id]["player_dict"][json_data.uuid].emit('PlayRes', {
                play_uuid: json_data.play_uuid,
                groupList: json_data.groupList
            });
            // modified 2019/12/03
            daList[p_id]["player_dict"][json_data.uuid].emit("Timer", json_data.expired_time);
            break;
        case "MemberRes": //5
            if(daList[p_id]["playing_socket"] != undefined){
                daList[p_id]["playing_socket"].emit("MemberRes", json_data.data);
            }
            break;
        case "Loading": //7
            if(daList[p_id]["playing_socket"] != undefined){
                daList[p_id]["playing_socket"].emit("Loading", json_data.data);
            }
            break;
        case "DisplayFinish": //9
            if(daList[p_id]["playing_socket"] != undefined){
                daList[p_id]["playing_socket"].emit("DisplayFinish", json_data.data);
            }
            break;
        default:
            break;
    }
    utils.sendResponse(res, 200, "[sys] Successful Pul data!");
})