#!/usr/bin/env python3
from flask import Flask
from flask import render_template, render_template_string, request
from flask_socketio import SocketIO, emit
from flask_bootstrap import Bootstrap

from iottalkpy import dan
from ccmapi.v0.config import config as ccm_config
import ccmapi.v0 as api
from config import env_config

import json, threading, time, requests, uuid

from genQRcode import genQRimg
import query
import utlis

''' SocketIO data '''
signal_type = None
status = None

''' Current Existing Frame '''
Frame = {}

''' Initialize Flask '''
app = Flask(__name__)
bootstrap = Bootstrap(app)
socketio = SocketIO(app)

''' Server Route '''
@app.route("/", methods=['GET'], strict_slashes=False)
def index():
    #p_id, ido_id, odo_id, dev_name = utlis.create_frame(len(Frame)+1)
    p_id, ido_id, odo_id = 17, 51, 52
    dev_name = 'Frame_' + str(len(Frame)+1)
    return render_template("homepage.html",
                           csm_url=env_config.csm_api,
                           dm_name=env_config.odm['name'],
                           idf_list=env_config.odm['idf_list'],
                           odf_list=env_config.odm['odf_list'],
                           p_id=p_id,
                           ido_id=ido_id,
                           odo_id=odo_id,
                           dev_name=dev_name)

@app.route('/bind/<string:s_id>', methods=['POST'], strict_slashes=False)
def bind(s_id):
    p_id = int(Frame[s_id]['p_id'])
    do_id = int(Frame[s_id]['do_id'])
    d_id = Frame[s_id]['d_id']
    utlis.bind_frame(p_id, do_id, d_id)
    return "Success Binding"

@app.route('/group', methods=['GET'], strict_slashes=False)
def getGroup():
    group_list = query.get_group_list()
    return group_list

@socketio.on('START')
def onConnect(msg):
    currentSocketId = request.sid
    current_mac = gen_uuid()
    Frame[currentSocketId] = {
        'd_id': current_mac,
        'p_id': msg['p_id'],
        'do_id': msg['do_id']
    }
    emit('ID', {
        'key': currentSocketId,
        'id': current_mac
    })
    print(f'Add Socket {currentSocketId}')

@socketio.on('END')
def offConnect():
    currentSocketId = request.sid
    del Frame[currentSocketId]
    print(f'Remove Socket {currentSocketId}')

'''@socketio.on("loading")
def loading_handler(data):
    global signal_type, status

    signal_type = data.split(":")[0]
    status = data.split(":")[1]
    print("[SocketIO] receive data ", signal_type, status)'''

def gen_uuid():
    mac = str(uuid.uuid4())
    return mac

if __name__ == "__main__":
    ''' create target URL's QR Code '''
    '''genQRimg(f"{env_config.webServerURL}:{env_config.webServerPort}/game")
    print('[sys] Create QR Code Successfully')'''

    '''t = threading.Thread(target=IoT_connect, daemon=True)
    t.start()'''

    socketio.run(app, host=env_config.host, port=env_config.port)