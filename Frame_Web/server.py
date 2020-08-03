#!/usr/bin/env python3
from flask import Flask
from flask import render_template, jsonify, request
from flask_socketio import SocketIO, emit
from flask_bootstrap import Bootstrap
from flask_cors import CORS
import uuid, requests

from config import env_config

import query
import utlis

''' Current Existing Wireframe '''
Frame = {}
Web = {}

''' Initialize Flask '''
app = Flask(__name__,template_folder="templates",static_folder="static",static_url_path="/static")
CORS(app, resources={r"/.*": {"origins": ["http://localhost:3000"]}}) 
bootstrap = Bootstrap(app)
socketio = SocketIO(app, cors_allowed_origins='*')

''' Server Route '''
@app.route("/", methods=['GET'], strict_slashes=False)
def index():
    #p_id, ido_id, odo_id, dev_name = utlis.create_frame(len(Frame)+1)
    #p_id, ido_id, odo_id = 17, 51, 52
    #dev_name = 'Frame_' + str(len(Frame)+1)
    return render_template("index.html")

@app.route('/init', methods=['GET'], strict_slashes=False)
def getInit():
    p_id, ido_id, odo_id, dev_name = utlis.create_frame(gen_uuid())
    # p_id, ido_id, odo_id = 17, 51, 52
    # dev_name = f'Frame_{gen_uuid()}
    timer = query.get_all_timer()
    initConfig = {
        'csm_url': env_config.csm_api,
        'dm_name': env_config.odm['name'],
        'idf_list': env_config.odm['idf_list'],
        'odf_list': env_config.odm['odf_list'],
        'p_id': p_id,
        'ido_id': ido_id,
        'odo_id': odo_id,
        'dev_name': dev_name,
        'client_url': env_config.webServer['url'] + ":" + str(env_config.webServer['port']) + "/game?p_id=" + str(p_id) + "&od_id=" + str(ido_id),
        'timer': timer
    }
    return jsonify({'initConfig': initConfig})

@app.route('/push', methods=['POST'], strict_slashes=False)
def push():
    data = request.get_json()
    Web[int(data["p_id"])].push(data["idf"], data["data"])
    return jsonify({"result": "Push Successful!"})

@app.route('/bind/<string:s_id>', methods=['POST'], strict_slashes=False)
def bind(s_id):
    if s_id in Frame:
        p_id = int(Frame[s_id]['p_id'])
        do_id = int(Frame[s_id]['do_id'])
        d_id = Frame[s_id]['d_id']
        utlis.bind_frame(p_id, do_id, d_id)
        return jsonify({"result": "Success Binding"})
    else:
        return jsonify({"result": "Fail Binding"}), 404

@app.route('/getExpiredTime', methods=['GET'], strict_slashes=False)
def getTimer():
    # i.e. http://localhost:5000/getExpiredTime?mode=guess&stage=game
    mode = request.args.get("mode")
    stage = request.args.get("stage")

    timer = query.get_timer(mode, stage)
    return jsonify({'timer': timer})

@app.route('/getAllExpiredTime', methods=['GET'], strict_slashes=False)
def getAllTimer():
    timer = query.get_all_timer()
    return jsonify(timer)

@app.route('/group', methods=['GET'], strict_slashes=False)
def getGroup():
    group_list = query.get_group_list()
    return jsonify({'group_list': group_list})

@app.route('/group/<string:g_id>', methods=['GET'], strict_slashes=False)
def getMember(g_id):
    member_list = query.get_member_list(g_id)
    return jsonify({'member_list': member_list})

@app.route('/member/<string:m_id>', methods=['GET'], strict_slashes=False)
def getPicture(m_id):
    picture_list = query.get_answer_pic(m_id)
    return jsonify({'picture_list': picture_list})

@socketio.on('START')
def onConnect(msg):
    currentSocketId = request.sid
    current_mac = gen_uuid()
    Frame[currentSocketId] = {
        'd_id': current_mac,
        'p_id': msg['p_id'],
        'do_id': msg['odo_id']
    }
    emit('ID', {
        'key': currentSocketId,
        'id': current_mac
    })
    Web[msg['p_id']] = utlis.DAI(msg['p_id'], msg['ido_id'], gen_uuid())
    Web[msg['p_id']].register()
    Web[msg['p_id']].bind()
    requests.post(f'{env_config.webServer["url"]}:{env_config.webServer["port"]}/register',data={"p_id": msg['p_id']})
    print(f'Add Socket {currentSocketId}')

@socketio.on('END')
def offConnect():
    currentSocketId = request.sid
    p_id = Frame[currentSocketId]['p_id']
    do_id = Frame[currentSocketId]['do_id']
    utlis.unbind_frame(p_id, do_id)
    Web[p_id].deregister()
    requests.post(f'{env_config.webServer["url"]}:{env_config.webServer["port"]}/deregister',data={"p_id": p_id})
    utlis.delete_frame(p_id)
    del Frame[currentSocketId]
    print(f'Remove Socket {currentSocketId}')

@socketio.on('disconnect')
def detect_disconnect():
    currentSocketId = request.sid
    if currentSocketId in Frame:
        p_id = Frame[currentSocketId]['p_id']
        do_id = Frame[currentSocketId]['do_id']
        utlis.unbind_frame(p_id, do_id)
        Web[p_id].deregister()
        requests.post(f'{env_config.webServer["url"]}:{env_config.webServer["port"]}/deregister',data={"p_id": p_id})
        utlis.delete_frame(p_id)
        del Frame[currentSocketId]
    print(f'Socket {currentSocketId} Disconnect')

def gen_uuid():
    mac = str(uuid.uuid4())
    return mac

if __name__ == "__main__":
    socketio.run(app, host=env_config.host, port=env_config.port)