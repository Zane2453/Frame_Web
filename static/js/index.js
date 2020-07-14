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
        do_id: odo_id
    });
    socketIo.on('ID', (curID)=>{
        device_id = curID.id;
        key = curID.key;
        initial();
    });
});

$(window).on('beforeunload', function (e) {
    //dan2.deregister();
    socketIo.emit('END');
});

function MsgHandler(dest, data){
    if(dest == 'Processing'){
        // TODO: Implement the Processing Side Function
        Processing(data);
    } else{
        signal_type = data.split(":")[0];
        status = data.split(":")[1];
        console.log("[processing] recv data ", signal_type, status);
        if(signal_type == "load"){
            push("PlayAck-I", JSON.stringify({
                "op": "Loading",
                "data": status
            }))
        } else if(signal_type == "display"){
            push("PlayAck-I", JSON.stringify({
                "op": "DisplayFinish",
                "data": "true"
            }));
        }
    }
}

// TODO: Modify the Processing Side Function
function Processing(data){
    signal_type = data.split(",")[0];
    if(signal_type == 'p'){
        MsgHandler('DAI', "load:50%");
        MsgHandler('DAI', "load:finish");
    } else if(signal_type == 'e'){
        MsgHandler('DAI', "display:finish");
    }
}