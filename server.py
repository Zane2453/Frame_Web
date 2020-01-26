from flask import Flask, request, session
from flask import render_template
from flask_socketio import SocketIO, emit
from flask_bootstrap import Bootstrap

from model import (connect, get_session,
                   Question, Picture, Group, GroupMember)

from iottalkpy import dan
from config import (
    IoTtalk_URL, device_model, device_name, device_addr, username,
    idf_list, odf_list,
    webServerURL, webServerPort,
    manageServerURL, manageServerPort)

import qrcode
import json
import requests
import threading
import sys
import time

connection_sock = None  # socket connection identification
_flags = {} # represent df state
end_game = False
player_uuid = None
play_mode = None # 0: guess; 1: shake

signal_type = None
status = None

''' Function of Generating QR_Code '''
def genQRimg(url):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )

    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image()
    img.save("static/img/qrcode.png")

''' Function of Accessing Database '''
def get_group_list():
    query = (db_session
            .query(Group.id,
                   Group.name)
            .select_from(Group)
            .filter(Group.status == 1)
            .all())

    group_dict = {}
    group_list = []
    for groupId, group_name in query:
        if(groupId not in group_dict):
            group_dict[groupId] = "yes"
            group_list.append({
                "id": groupId,
                "name": group_name
            })

    groupList = {
        "group": group_list
    }

    print("[DB] get groupList success")
    return groupList

def get_member_list(group_id):
    if(group_id == "all"):
        query = (db_session
                .query(Question.id,
                       Question.name,
                       Question.description)
                .select_from(Question)
                .filter(Question.status == 1)
                .all())
    else:
        query = (db_session
                .query(Question.id,
                       Question.name,
                       Question.description)
                .select_from(GroupMember)
                .join(Question)
                .filter(GroupMember.groupId == group_id)
                .all())

    member_list = []
    for questionId, question_name, question_description in query:
        member_list.append({
            "id": questionId,
            "name": question_name,
            "description": question_description
            })

    print("[DB] get %s's memberList success" % (group_id))
    return member_list

def get_answer_pic(questio_id):
    picture_data = ""

    query = (db_session
            .query(Picture.id,
                   Picture.order)
            .select_from(Picture)
            .filter(Picture.questionId == questio_id)
            .order_by(Picture.order)
            .all())

    for pic_id, pic_order in query:
        picture_data = picture_data + "," + pic_id
    picture_data = "p" + picture_data + ";"

    print("[DB] get %s picture data success" % questio_id)
    return picture_data

''' Initialize Flask '''
app = Flask(__name__)
bootstrap = Bootstrap(app)
socketio = SocketIO(app)

def push_PlayAck_I(data):
    global _flags
    if(_flags.get("PlayAck-I")):
        dan.log("[da] push PlayAck-I ", data)
        dan.push("PlayAck-I", data)

def cmd2processing(msg):
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
                    "groupList": get_group_list()
                }))
                # let processing show "play"
                cmd2processing("s,0;")
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
                cmd2processing("q,0;")

    elif (odf_name == "Name-O"):
        data = json.loads(data[0])
        if (data["type"] == "mode"):
            if (player_uuid == None):
                return True
            # keep game mode
            play_mode = data["mode"]
            # show group page
            cmd2processing("g,0;")
        elif (data["type"] == "group"):
            if (player_uuid == None):
                return True
            push_PlayAck_I(json.dumps({
                "op": "MemberRes",
                "data": get_member_list(data["id"])
            }))
            # check play_mode, display diff page
            if (play_mode == 0):
                pass
            elif (play_mode == 1):
                cmd2processing("m,0;")
        elif (data["type"] == "answer"):
            if (player_uuid == None):
                return True
            # this game is start
            end_game = False
            # query DB for getting answer pictures
            cmd2processing(get_answer_pic(data["id"]))
            # start loading, and when loading is finished, push_PlayAck_I
            socket_loading_handler()
        elif (data["type"] == "weather"):
            # weather DA
            weather = data["data"]
            # send weather to processing
            cmd2processing("w," + weather + ";")
    elif (odf_name == "Forward"):
        if (player_uuid == None or end_game == True or data[0] == 0):
            return True
        # let processing display the next picture
        cmd2processing("f,0;")
    elif (odf_name == "End"):
        if (player_uuid == None or end_game == True or data[0] == 0):
            return True
        # this game is over
        end_game = True
        # let processing display the remained pictures
        cmd2processing("e,0;")
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
        IoTtalk_URL,
        on_signal=on_signal,
        on_data=on_data,
        idf_list=idf_list,
        odf_list=odf_list,
        accept_protos=['mqtt'],
        name=device_name,
        id_=device_addr,
        profile={
            'model': device_model,
            'u_name': username
        },
        on_register=on_register,
        on_deregister=on_deregister
    )

    while 1:
        time.sleep(0.2)

@app.route("/", methods=['GET'], strict_slashes=False)
def index():
    return render_template("homepage.html")

@socketio.on("loading")
def loading_handler(data):
    global signal_type, status

    signal_type = data.split(":")[0]
    status = data.split(":")[1]
    print("[SocketIO] receive data ", signal_type, status)

if __name__ == "__main__":
    ''' create target URL's QR Code '''
    genQRimg(f"{webServerURL}:{webServerPort}/game")
    print('[sys] Create QR Code Successfully')

    ''' create database '''
    connect()
    db_session = get_session()
    print('[sys] Create Database Successfully')

    t = threading.Thread(target=IoT_connect, daemon=True)
    t.start()

    #app.run()
    socketio.run(app, host='127.0.0.1', port='7788')