from iottalkpy import dan
import json, time

from config import env_config

import query

''' IoTtalk data function '''
def push_PlayAck_I(data):
    global _flags
    if(_flags.get("PlayAck-I")):
        dan.log("[da] push PlayAck-I ", data)
        dan.push("PlayAck-I", data)

def cmd2socket(msg):
    global socketio
    print("[SocketIO] send msg ", msg)
    socketio.emit("frame", msg)

def socket_loading_handler():
    global signal_type, status

    while True:
        if (signal_type == "load"):
            push_PlayAck_I(json.dumps({
                "op": "Loading",
                "data": status
            }))
            if (status == "finish"):
                break
        elif (signal_type == "display"):
            push_PlayAck_I(json.dumps({
                "op": "DisplayFinish",
                "data": "true"
            }))
            break

''' IoTtalk data handler '''
def on_data(odf_name, data):
    global player_uuid, end_game, play_mode
    dan.log.info(f"[da] {odf_name}: {data}")

    if (odf_name == "Mode"):
        data = json.loads(data[0])
        if (data["op"] == "PlayReq"):
            # save the first uuid until leave or timeout
            if (player_uuid == None or player_uuid == data["uuid"]):
                print(data['uuid'])
                # modified 2019/12/03
                #expired_time = requests.get(f"{manageServerURL}:{manageServerPort}/getExpiredTime").json()

                player_uuid = data["uuid"]
                play_mode = None
                push_PlayAck_I(json.dumps({
                    "op": "PlayRes",
                    "uuid": data["uuid"],
                    "play_uuid": player_uuid,
                    #"expired_time": expired_time,
                    "groupList": query.get_group_list()
                }))
                # let processing show "play"
                cmd2socket("s,0;")
            else:
                push_PlayAck_I(json.dumps({
                    "op": "PlayRes",
                    "uuid": data["uuid"],
                    "play_uuid": player_uuid
                }))
        elif (data["op"] == "Leave"):
            print(player_uuid, data['uuid'])
            if (player_uuid == data["uuid"]):
                player_uuid = None
                play_mode = None
                # let processing show "see you"
                cmd2socket("q,0;")

    elif (odf_name == "Name-O"):
        data = json.loads(data[0])
        if (data["type"] == "mode"):
            if (player_uuid == None):
                return True
            # keep game mode
            play_mode = data["mode"]
            # show group page
            cmd2socket("g,0;")
        elif (data["type"] == "group"):
            if (player_uuid == None):
                return True
            push_PlayAck_I(json.dumps({
                "op": "MemberRes",
                "data": query.get_member_list(data["id"])
            }))
            # check play_mode, display diff page
            if (play_mode == 0):
                pass
            elif (play_mode == 1):
                cmd2socket("m,0;")
        elif (data["type"] == "answer"):
            if (player_uuid == None):
                return True
            # this game is start
            end_game = False
            # query DB for getting answer pictures
            cmd2socket(query.get_answer_pic(data["id"]))
            # start loading, and when loading is finished, push_PlayAck_I
            socket_loading_handler()
        elif (data["type"] == "weather"):
            # weather DA
            weather = data["data"]
            # send weather to processing
            cmd2socket("w," + weather + ";")
    elif (odf_name == "Forward"):
        if (player_uuid == None or end_game == True or data[0] == 0):
            return True
        # let processing display the next picture
        cmd2socket("f,0;")
    elif (odf_name == "End"):
        if (player_uuid == None or end_game == True or data[0] == 0):
            return True
        # this game is over
        end_game = True
        # let processing display the remained pictures
        cmd2socket("e,0;")
        # start loading, and when display is finished, push_PlayAck_I
        socket_loading_handler()
    return True
    #socketio.emit("frame", "test")

def on_signal(signal, df_list):
    global _flags
    dan.log.info('[cmd] %s, %s', signal, df_list)
    if 'CONNECT' == signal:
        for df_name in df_list:
            _flags[df_name] = True
    elif 'DISCONNECT' == signal:
        for df_name in df_list:
            _flags[df_name] = False
    elif 'SUSPEND' == signal:
        pass    # Not use
    elif 'RESUME' == signal:
        pass    # Not use
    return True

def on_register():
    dan.log.info('[da] register successfully')

def on_deregister():
    dan.log.info('[da] register fail')

''' IoTtalk connection handler '''
def IoT_connect():
    ''' IoTtalk connection '''
    context = dan.register(
        env_config.IoTtalk_URL,
        on_signal=on_signal,
        on_data=on_data,
        idf_list=env_config.idf_list,
        odf_list=env_config.odf_list,
        accept_protos=['mqtt'],
        name=env_config.device_name,
        id_=env_config.device_addr,
        profile={
            'model': env_config.device_model,
            'u_name': env_config.username
        },
        on_register=on_register,
        on_deregister=on_deregister
    )

    while 1:
        time.sleep(0.2)