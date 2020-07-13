$.ajaxSetup({async:false});

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
    socketIo.on('GROUP', (group)=>{
        push_PlayAck_I(json.dumps({
            "op": "PlayRes",
            "uuid": play_uuid["uuid"],
            "play_uuid": player_uuid
        }))
    });
});

var _wasPageCleanedUp = false;
function pageCleanup()
{
    if (!_wasPageCleanedUp)
    {
        /*$.ajax({
            type: 'GET',
            //async: true,
            url: 'http://127.0.0.1:5000/test',
            success: function ()
            {
                _wasPageCleanedUp = true;
            }
        });*/
        dan2.deregister();
        _wasPageCleanedUp = true;
    }
}

$(window).on('beforeunload', function (e) {
    //dan2.deregister();
    //pageCleanup();
    socketIo.emit('END');
});