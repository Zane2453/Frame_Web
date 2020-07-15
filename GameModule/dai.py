#!/usr/bin/env python3
import atexit
import json
import socket
import sys
import threading
import time
import requests
import asyncio
import websockets
from dan import (log, register, push, deregister)
from config import (IoTtalk_URL,
                    device_name,
                    webServerURL,
                    manageServerURL, manageServerPort)
from collections import deque

import genQRcode
import query

rp_timer = None
_flags = {}
end_game = False
processing_sock = None
processing_websockets = None
player_uuid = None
play_mode = None  # 0: guess; 1: shake
queue = None


class RepeatingTimer(object):
    def __init__(self, interval, f, *args, **kwargs):
        self.interval = interval
        self.f = f
        self.args = args
        self.kwargs = kwargs
        self.timer = None

    def callback(self):
        self.f(*self.args, **self.kwargs)
        self.start()

    def cancel(self):
        print('timer cancel')
        if(self.timer):
            self.timer.cancel()

    def start(self):
        print('timer start')
        self.timer = threading.Timer(self.interval, self.callback)
        self.timer.start()

    def restart(self):
        print('timer restart')
        self.cancel()
        self.start()


def timer_handler():
    print('timeout!! in timer_handler')
    global player_uuid, play_mode

    if(player_uuid != None):
        # time's up, clear player_uuid
        player_uuid = None
        play_mode = None
        # and let processing back to waether mode
        cmd2processing("x,0;")


def convert2weathercode(weather):
    weather_code = '0'
    if weather in ['clear sky', 'few clouds']:
        weather_code = '0'  # 'sunny_d'
    elif weather in ['scattered clouds', 'mist']:
        weather_code = '1'  # 'cloudy_d'
    elif weather in ['broken clouds']:
        weather_code = '2'  # 'brokenclouds_d'
    elif weather in ['rain']:
        weather_code = '3'  # 'rainy_d'
    elif weather in ['shower rain', 'thunderstorm']:
        weather_code = '4'  # 'showerrain_d'

    print("[sys] weather_code", weather_code)
    return weather_code


def cmd2processing(msg):
    global processing_websockets
    if(processing_websockets):
        new_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(new_loop)
        loop = asyncio.get_event_loop()
        loop.run_until_complete(processing_websockets.send(msg))
        # syncio.run(processing_websockets.send(msg))
        print("[processing] send msg ", msg)


def processing_loading_handler():
    global processing_sock
    global processing_websockets

    while True:
        # blocking socket IO, so dai will wait here for processing signal
        raw_data = getwebsocketdata()
        data = raw_data
        signal_type = data.split(":")[0]
        status = data.split(":")[1]
        print("[processing] recv data ", signal_type, status)

        if(signal_type == "load"):
            push_PlayAck_I(json.dumps({
                "op": "Loading",
                "data": status
            }))
            if(status == "finish"):
                break
        elif(signal_type == "display"):
            push_PlayAck_I(json.dumps({
                "op": "DisplayFinish",
                "data": "true"
            }))
            break


def push_PlayAck_I(data):
    if(_flags.get("PlayAck-I")):
        print("[da] push PlayAck-I ", data)
        push("PlayAck-I", data)


def on_signal(signal, df_list):
    global _flags
    log.info('[cmd] %s, %s', signal, df_list)
    if 'CONNECT' == signal:
        for df_name in df_list:
            _flags[df_name] = True
    elif 'DISCONNECT' == signal:
        for df_name in df_list:
            _flags[df_name] = False
    elif 'SUSPEND' == signal:
        # Not use
        pass
    elif 'RESUME' == signal:
        # Not use
        pass
    return True


def on_data(odf_name, data):
    global player_uuid, end_game, rp_timer, play_mode
    print("[da] [data] ", odf_name, data)

    if(odf_name == "Mode"):
        data = json.loads(data[0])
        if(data["op"] == "PlayReq"):
            # save the first uuid until leave or timeout
            # [TODO] lock here
            if(player_uuid == None or player_uuid == data["uuid"]):
                print(data['uuid'])
                # start countdown
                # rp_timer.restart()
                # modified 2019/12/03
                expired_time = requests.get(
                    f"{manageServerURL}:{manageServerPort}/getExpiredTime").json()

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
        processing_loading_handler()
    return True


def register_callback():
    print('[da] register successfully')


async def register_frame(websocket, path):
    global processing_websockets
    global queue
    queue = deque()
    processing_websockets = websocket
    print('[sys] Processing is connected')
    # IoTtalk connection
    device_model = 'PortraitGuess'
    idf_list = [['PlayAck-I', ['g']]]
    odf_list = [['Mode',      ['g']],
                ['Name-O',    ['g']],
                ['Forward',   ['g']],
                ['End',       ['g']]]

    context = register(
        IoTtalk_URL,
        on_signal=on_signal,
        on_data=on_data,
        accept_protos=['mqtt'],
        idf_list=idf_list,
        odf_list=odf_list,
        name=device_name,
        profile={
            'model': device_model
        },
        register_callback=register_callback,
    )
    atexit.register(deregister)
    while True:
        if(processing_websockets):
            data = await processing_websockets.recv()
            queue.append(data)


def getwebsocketdata():
    global queue
    while True:
        if(queue):
            return queue.popleft()
        else:
            time.sleep(1.5)


def main():
    # set signal handler
    # signal.signal(signal.SIGALRM, timer_handler)
    global rp_timer
    # rp_timer = RepeatingTimer(expired_time, timer_handler)

    # make game QRcode img
    genQRcode.genQRimg(webServerURL)

    # processing connection
    global processing_sock
    global processing_websockets
    print('[sys] Waiting for processing connection')
    start_server = websockets.serve(register_frame, "localhost", 8000)

    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()


if __name__ == '__main__':
    main()
