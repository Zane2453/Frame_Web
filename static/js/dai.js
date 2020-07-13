// create by Zane 2020/07/13
var _flags = {},    // represent df state
    end_game = false,
    player_uuid = null,
    play_mode = null,   // 0: guess; 1: shake
    expired_time = null;

function initial(){
    var profile = {
        name: dev_name,
        dm_name: dm_name,
    };

    var msg = {
        id: device_id,
        on_signal: on_signal,
        on_data: on_data,
        name: profile.name,
        idf_list: idf_list,
        odf_list: odf_list,
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
        console.log(data);
        if(data['op'] == 'PlayReq'){
            // save the first uuid until leave or timeout
            console.log(data['uuid']);

            expired_time = 50;

            player_uuid = data["uuid"];
            play_mode = null;
            socketIo.emit('GROUP');
        }
    }
        /*data = json.loads(data[0])
        if(data["op"] == "PlayReq"):
            # save the first uuid until leave or timeout
            # [TODO] lock here
            if(player_uuid == None or player_uuid == data["uuid"]):
                print(data['uuid'])
                # start countdown
                # rp_timer.restart()
                # modified 2019/12/03
                expired_time = requests.get(f"{manageServerURL}:{manageServerPort}/getExpiredTime").json()

                player_uuid = data["uuid"]
                play_mode = None
                push_PlayAck_I(json.dumps({
                    "op": "PlayRes",
                    "uuid": data["uuid"],
                    "play_uuid": player_uuid,
                    "expired_time": expired_time,
                    "groupList": query.get_group_list()
                }))
                # let processing show "play"
                cmd2processing("s,0;")
            else:
                push_PlayAck_I(json.dumps({
                    "op": "PlayRes",
                    "uuid": data["uuid"],
                    "play_uuid": player_uuid
                }))
        elif(data["op"] == "Leave"):
            # [TODO] lock here
            print(player_uuid, data['uuid'])
            if(player_uuid == data["uuid"]):
                player_uuid = None
                play_mode = None
                # let processing show "see you"
                cmd2processing("q,0;")
                # clear countdown
                # rp_timer.cancel()
    elif(odf_name == "Name-O"):
        data = json.loads(data[0])
        if(data["type"] == "mode"):
            if(player_uuid == None):
                return True
            # start countdown
            # rp_timer.restart()
            # keep game mode
            play_mode = data["mode"]
            # show group page
            cmd2processing("g,0;")
        elif(data["type"] == "group"):
            if(player_uuid == None):
                return True
            # start countdown
            # rp_timer.restart()
            push_PlayAck_I(json.dumps({
                "op": "MemberRes",
                "data": query.get_member_list(data["id"])
            }))
            # check play_mode, display diff page
            if(play_mode == 0):
                pass
            elif(play_mode == 1):
                cmd2processing("m,0;")
        elif(data["type"] == "answer"):
            if(player_uuid == None):
                return True
            # this game is start
            end_game = False
            # start countdown
            # rp_timer.restart()
            # query DB for getting answer pictures
            cmd2processing(query.get_answer_pic(data["id"]))
            # start loading, and when loading is finished, push_PlayAck_I
            processing_loading_handler()
        elif(data["type"] == "weather"):
            # weather DA
            weather = data["data"]
            # send weather to processing
            cmd2processing("w," + weather + ";")
    elif(odf_name == "Forward"):
        if(player_uuid == None or end_game == True or data[0] == 0):
            return True
        # start countdown
        # rp_timer.restart()
        # let processing display the next picture
        cmd2processing("f,0;")
    elif(odf_name == "End"):
        if(player_uuid == None or end_game == True or data[0] == 0):
            return True
        # this game is over
        end_game = True
        # start countdown
        # rp_timer.restart()
        # let processing display the remained pictures
        cmd2processing("e,0;")
        # start loading, and when display is finished, push_PlayAck_I
        processing_loading_handler()*/
    return true;
}

function init_callback(result) {
    console.log('register:', result);
    url = urls.frame_bind(key)
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