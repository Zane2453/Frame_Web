// create by Zane 2020/07/13
var _flags = {},    // represent df state
    end_game = false,
    player_uuid = null,
    play_mode = null,   // 0: guess; 1: shake
    expired_time = null,
    picture_number = null;

function initial(){
    var profile = {
        name: configs.dev_name,
        dm_name: configs.dm_name,
    };

    var msg = {
        id: device_id,
        on_signal: on_signal,
        on_data: on_data,
        name: profile.name,
        idf_list: configs.idf_list,
        odf_list: configs.odf_list,
        profile: {model: profile.dm_name},
        accept_protos: ['mqtt'],
    };

    dan2.register(urls.csm_url, msg, init_callback);
}

function on_signal(cmd, param) {
    console.log('[cmd]', cmd, param);
    return true;
}

function on_data(odf_name, data) {
    console.log("[da] [data] ", odf_name, data);
    if(odf_name == "Mode"){
        var data = JSON.parse(data[0]);
        //console.log(data);
        if(data['op'] == 'PlayReq'){
            // save the first uuid until leave or timeout
            if(player_uuid == null || player_uuid == data["uuid"]){
                console.log(data['uuid']);

                player_uuid = data["uuid"];
                play_mode = null;

                $.ajax({
                    type: 'GET',
                    //async: true,
                    url: `${url}:${port}/group`,
                    error: function(e) {
                        console.log(e);
                    },
                    success: function (groupList) {
                        console.log(groupList);
                        push("PlayAck-I", JSON.stringify({
                            "op": "PlayRes",
                            "uuid": data["uuid"],
                            "play_uuid": player_uuid,
                            "expired_time": configs.timer,  // modified 2020/08/07
                            "groupList": groupList['group_list']
                        }));
                        // let processing show "play"
                        MsgHandler('Processing', "s,0;");
                    }
                });
            } else{
                push("PlayAck-I", JSON.stringify({
                    "op": "PlayRes",
                    "uuid": data["uuid"],
                    "play_uuid": player_uuid
                }));
            }
        } else if(data["op"] == "Leave"){
            console.log(player_uuid, data['uuid']);
            if(player_uuid == data["uuid"]){
                player_uuid = null;
                play_mode = null;
                // let processing show "see you"
                MsgHandler('Processing', "q,0;");
            }
        }
    } else if(odf_name == 'Name-O'){
        var data = JSON.parse(data[0]);
        if(data["type"] == "mode"){
            if(player_uuid == null)
                return true;

            // keep game mode
            play_mode = data["mode"];
            // show group page
            MsgHandler('Processing', "g,0;");
        } else if(data["type"] == "group"){
            if(player_uuid == null)
                return true;

            $.ajax({
                type: 'GET',
                //async: true,
                url: `${url}:${port}/group/${String(data["id"])}`,
                error: function(e) {
                    console.log(e);
                },
                success: function (memberList) {
                    console.log(memberList);
                    push("PlayAck-I", JSON.stringify({
                        "op": "MemberRes",
                        "data": memberList['member_list']
                    }));

                    // check play_mode, display diff page
                    if(play_mode == 0){
                        //pass
                    } else if(play_mode == 1){
                        MsgHandler('Processing', "m,0;");
                    }
                }
            });
        } else if(data["type"] == "answer"){
            if(player_uuid == null)
                return true;

            // # this game is start
            end_game = false;

            // query DB for getting answer pictures
            $.ajax({
                type: 'GET',
                //async: true,
                url: `${url}:${port}/member/${String(data["id"])}`,
                error: function(e) {
                    console.log(e);
                },
                success: function (pictureList) {
                    console.log(pictureList);
                    picture_number = pictureList['picture_number'];
                    MsgHandler('Processing', pictureList['picture_list']);
                    // start loading, and when loading is finished, push_PlayAck_I
                }
            });
        } else if(data["type"] == "weather"){
            // weather DA
            var weather = data["data"];
            // send weather to processing
            MsgHandler('Processing', "w," + weather + ";");
        }
    } else if(odf_name == 'Forward'){
        if(player_uuid == null || end_game == true || data[0] == 0)
            return true;

        // let processing display the next picture
        MsgHandler('Processing', "f,0;");
    } else if(odf_name == 'End'){
        if(player_uuid == null || end_game == true || data[0] == 0)
            return true;

        // this game is over
        end_game = true;

        // let processing display the remained pictures
        MsgHandler('Processing', "e,0;");
        // start loading, and when display is finished, push_PlayAck_I
    }
    return true;
}

function init_callback(result) {
    console.log('register:', result);
    let url = urls.frame_bind(key)
    $.post(url, {
        dataType: 'json',
    })
    .done(function() {
        console.log('device binding success')
    })
    .fail(function() {
        console.log('device binding failed')
    })
}

function push(idf_name, data) {
    console.log('[da] [data] PlayAck-I', data);
    if (!(data instanceof Array))
        data = [data];
    dan2.push(idf_name, data);
}