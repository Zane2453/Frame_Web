#!/usr/bin/env python3
from flask import Flask
from flask import render_template, jsonify, request
from flask_socketio import SocketIO, emit
from flask_bootstrap import Bootstrap
from flask_cors import cross_origin # Fix the CROS issue
import uuid

from config import env_config

import query
import utlis

''' Current Existing Wireframe '''
Frame = {}

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
    #p_id, ido_id, odo_id, dev_name = utlis.create_frame(gen_uuid())
    p_id, ido_id, odo_id = 17, 51, 52
    dev_name = 'Frame_' + str(p_id)

    # Return FrameTalk Render
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
@cross_origin()
def bind(s_id):
    # Get the PortraitGuess Project ID and Device Object ID
    p_id = int(Frame[s_id]['p_id'])
    do_id = int(Frame[s_id]['do_id'])
    d_id = Frame[s_id]['d_id']

    # Bind the PortraitGuess
    utlis.bind_frame(p_id, do_id, d_id)
    return jsonify({"result": "Success Binding"})

@app.route('/leave', methods=['POST'], strict_slashes=False)
@cross_origin()
def leave():
    data = request.get_json()
    socketio.emit("Leave", {
        "p_id": data["p_id"],
        "uuid": data["uuid"]
    })
    return jsonify({"result": "Success Leave"})

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
    picture_list = query.get_answer_pic(m_id)
    return jsonify({'picture_list': picture_list})

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
        'do_id': msg['do_id']
    }
    emit('ID', {
        'key': currentSocketId,
        'id': current_mac
    })
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
    #utlis.deregister_webserver(p_id, do_id)

    # Delete FrameTalk Project
    #utlis.delete_frame(p_id)
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
        #utlis.deregister_webserver(p_id, do_id)

        # Delete FrameTalk Project
        #utlis.delete_frame(p_id)
        del Frame[currentSocketId]
    print(f'Socket {currentSocketId} Disconnect')

# Generate UUID
def gen_uuid():
    mac = str(uuid.uuid4())
    return mac

if __name__ == "__main__":
    socketio.run(app, host=env_config.host, port=env_config.port)