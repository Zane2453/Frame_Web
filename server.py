#!/usr/bin/env python3
from flask import Flask
from flask import render_template, jsonify, request
from flask_socketio import SocketIO, emit
from flask_bootstrap import Bootstrap
from flask_cors import cross_origin # Fix the CROS issue
import uuid, requests

from config import env_config

import query
import utlis

''' Current Existing Wireframe '''
Frame = {}
Web = {}

''' Initialize Flask '''
app = Flask(__name__, template_folder='templates')
bootstrap = Bootstrap(app)
# Fix the CROS issue
socketio = SocketIO(app, cors_allowed_origins='*', ping_timeout=10, ping_interval=5)

''' Server Route '''
@app.route("/", methods=['GET'], strict_slashes=False)
@cross_origin()
def index():
    # Create FrameTalk Project
    p_id, ido_id, odo_id, dev_name = utlis.create_frame(gen_uuid())
    timer = query.get_all_timer()
    '''p_id, ido_id, odo_id = 17, 51, 52
    dev_name = 'Frame_' + str(p_id)'''

    # Return FrameTalk Render
    return render_template("homepage.html",
                           csm_url=env_config.csm_api,
                           dm_name=env_config.odm['name'],
                           idf_list=env_config.odm['idf_list'],
                           odf_list=env_config.odm['odf_list'],
                           p_id=p_id,
                           ido_id=ido_id,
                           odo_id=odo_id,
                           dev_name=dev_name,
                           client_url=env_config.webServer['url'] + ":" + str(env_config.webServer['port']) + "/game?p_id=" + str(p_id) + "&od_id=" + str(ido_id),
                           timer=timer)

@app.route('/bind/<string:s_id>', methods=['POST'], strict_slashes=False)
@cross_origin()
def bind(s_id):
    # Get the PortraitGuess Project ID and Device Object ID
    if s_id in Frame:
        p_id = int(Frame[s_id]['p_id'])
        do_id = int(Frame[s_id]['do_id'])
        d_id = Frame[s_id]['d_id']

        # Bind the PortraitGuess
        utlis.bind_frame(p_id, do_id, d_id)
        return jsonify({"result": "Success Binding"})

    else:
        return jsonify({"result": "Fail Binding"}), 404

@app.route('/leave', methods=['POST'], strict_slashes=False)
@cross_origin()
def leave():
    data = request.get_json()
    socketio.emit("Leave", {
        "p_id": data["p_id"],
        "uuid": data["uuid"]
    })
    return jsonify({"result": "Success Leave"})

@app.route('/push', methods=['POST'], strict_slashes=False)
@cross_origin()
def push():
    data = request.get_json()
    Web[int(data["p_id"])].push(data["idf"], data["data"])
    return jsonify({"result": "Push Successful!"})

@app.route('/getExpiredTime', methods=['GET'], strict_slashes=False)
@cross_origin()
def getTimer():
    # i.e. http://localhost:5000/getExpiredTime?mode=guess&stage=game
    mode = request.args.get("mode")
    stage = request.args.get("stage")

    timer = query.get_timer(mode, stage)
    return jsonify({'timer': timer})

@app.route('/getAllExpiredTime', methods=['GET'], strict_slashes=False)
@cross_origin()
def getAllTimer():
    timer = query.get_all_timer()
    return jsonify(timer)

@app.route('/group', methods=['GET'], strict_slashes=False)
@cross_origin()
def getGroup():
    # Get the Group List
    group_list = query.get_group_list()
    return jsonify({'group_list': group_list})

@app.route('/group/<string:g_id>', methods=['GET'], strict_slashes=False)
@cross_origin()
def getMember(g_id):
    # Get the Member List of Group g_id
    member_list = query.get_member_list(g_id)
    return jsonify({'member_list': member_list})

@app.route('/member/<string:m_id>', methods=['GET'], strict_slashes=False)
@cross_origin()
def getPicture(m_id):
    # Get the Picture List of Member m_id
    picture_list, picture_number= query.get_answer_pic(m_id)
    return jsonify({'picture_list': picture_list, 'picture_number': picture_number})

@socketio.on('START')
def onConnect(msg):
    # Get the Current Socket ID
    currentSocketId = request.sid

    # Generate UUID
    current_mac = gen_uuid()

    # Bind the Current Socket ID with certain FrameTalk Project
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
    requests.post(f'{env_config.webServer["url"]}:{env_config.webServer["port"]}/register',
                  data={"p_id": msg['p_id']})
    print(f'Add Socket {currentSocketId}')

@socketio.on('END')
def offConnect():
    # Get the Current Socket ID
    currentSocketId = request.sid

    # Get the FrameTalk Project Information of Current Socket ID
    p_id = Frame[currentSocketId]['p_id']
    do_id = Frame[currentSocketId]['do_id']

    # Unbind the PortraitGuess
    utlis.unbind_frame(p_id, do_id)

    # Deregister the PGSmartphone
    Web[p_id].deregister()
    requests.post(f'{env_config.webServer["url"]}:{env_config.webServer["port"]}/deregister',
                  data={"p_id": p_id})
    #utlis.deregister_webserver(p_id, do_id)

    # Delete FrameTalk Project
    utlis.delete_frame(p_id)
    del Frame[currentSocketId]
    print(f'Remove Socket {currentSocketId}')

@socketio.on('disconnect')
def detect_disconnect():
    # Get the Current Socket ID
    currentSocketId = request.sid

    # Check whether the FrameTalk Project Information of Current Socket ID is removed
    if currentSocketId in Frame:
        # Get the FrameTalk Project Information of Current Socket ID
        p_id = Frame[currentSocketId]['p_id']
        do_id = Frame[currentSocketId]['do_id']

        # Unbind the PortraitGuess
        utlis.unbind_frame(p_id, do_id)

        # Deregister the PGSmartphone
        Web[p_id].deregister()
        requests.post(f'{env_config.webServer["url"]}:{env_config.webServer["port"]}/deregister',
                      data={"p_id": p_id})
        #utlis.deregister_webserver(p_id, do_id)

        # Delete FrameTalk Project
        utlis.delete_frame(p_id)
        del Frame[currentSocketId]
    print(f'Socket {currentSocketId} Disconnect')

# Generate UUID
def gen_uuid():
    mac = str(uuid.uuid4())
    return mac

if __name__ == "__main__":
    socketio.run(app, host=env_config.host, port=env_config.port)