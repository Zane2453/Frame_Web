//$.ajaxSetup({async:false});
var url = 'http://localhost';
var port = '5000';
var socketIo = io.connect(url + ':' + port);
var device_id = undefined,
    key = undefined;

$(function(){
    // Initialize
    socketIo.emit('START',{
        p_id: p_id,
        odo_id: odo_id,
        ido_id: ido_id
    });
    socketIo.on('ID', (curID)=>{
        device_id = curID.id;
        key = curID.key;
        initial();
    });
    socketIo.on("Leave", (msg)=>{
        if(p_id == msg["p_id"]){
            //console.log("WebServer Leave ", p_id);
            console.log(player_uuid, msg['uuid']);
            if(player_uuid == msg["uuid"]){
                player_uuid = null;
                play_mode = null;
                // let processing show "see you"
                MsgHandler('Processing', "q,0;");
            }
        }
    })
});

$(window).on('beforeunload', function (e) {
    //dan2.deregister();
    socketIo.emit('END');
});

function MsgHandler(dest, data){
    if(dest == 'Processing'){
        // TODO: Implement the Processing Side Function
        sendMsgFrame(data);
    } else{
        signal_type = data.split(":")[0];
        status = data.split(":")[1];
        console.log("[processing] recv data ", signal_type, status);
        if(signal_type == "load"){
            if(status == "finish"){
                push("PlayAck-I", JSON.stringify({
                    "op": "Loading",
                    "data": status,
                    "picture_number": picture_number
                }))
            } else{
                push("PlayAck-I", JSON.stringify({
                    "op": "Loading",
                    "data": status
                }))
            }
        } else if(signal_type == "display"){
            push("PlayAck-I", JSON.stringify({
                "op": "DisplayFinish",
                "data": "true"
            }));
        }
    }
}

// TODO: Modify the Processing Side Function
function sendMsgFrame(data){
    signal_type = data.split(",")[0];
    if(signal_type == 'p'){
        MsgHandler('DAI', "load:50%");
        MsgHandler('DAI', "load:finish");
    } else if(signal_type == 'e'){
        MsgHandler('DAI', "display:finish");
    }
}