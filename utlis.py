# The CCM API of IoTtalk
import ccmapi.v0 as api
from ccmapi.v0.config import config as ccm_config

from config import env_config
import requests

# Set CCM server URL
ccm_config.api_url = env_config.ccm_api
session = requests.Session()

# IoTtalk User Login
userid, cookie = api.account.login(env_config.username, env_config.pwd, session=session)

def create_frame(uuid):
    # Generate the Device Name
    dev_name = f'Frame_{uuid}'

    # Create the FrameTalk Project
    p_id = api.project.create(dev_name, session=session)
    api.project.on(p_id, session=session)

    # Create the Device Object PGSmartphone
    ido_id = api.deviceobject.create(p_id, 'PGSmartphone', ['PlayAck-O', 'Correct', 'Wrong', 'Name-I', 'Play-I', 'Acceleration'],session=session)
    # Create the Device Object PortraitGuess
    odo_id = api.deviceobject.create(p_id, 'PortraitGuess', ['PlayAck-I', 'End', 'Forward', 'Name-O', 'Mode'],
                                     session=session)
    # Create the Device Object Weather
    weather_id =api.deviceobject.create(p_id, 'Weather', ['Name-I'], session=session)

    # Set the Network Application of FrameTalk Project
    api.networkapplication.create(p_id, [(ido_id, 'Acceleration'), (odo_id, 'Forward'), (odo_id, 'End')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'Correct'), (odo_id, 'End')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'Wrong'), (odo_id, 'Forward')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'Name-I'), (odo_id, 'Name-O')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'Play-I'), (odo_id, 'Mode')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'PlayAck-O'), (odo_id, 'PlayAck-I')], session=session)
    api.networkapplication.create(p_id, [(weather_id, 'Name-I'), (odo_id, 'Name-O')], session=session)

    print(f"Create Frame Successfully!\nProject ID {p_id}, PGSmartphone ID {ido_id}, PortraitGuess ID {odo_id}")

    # Register the PGSmartphone
    #register_webserver(p_id, ido_id)

    return p_id, ido_id, odo_id, dev_name

def delete_frame(p_id):
    # Delete the FrameTalk Project
    api.project.delete(p_id, session=session)
    print(f"Delete Frame {p_id} Successfully!")

def register_webserver(p_id, do_id):
    # Register the PGSmartphone
    requests.post(f'{env_config.webServer["url"]}:{env_config.webServer["port"]}/register',
                  data={"p_id": p_id, "do_id": do_id})

def deregister_webserver(p_id, do_id):
    # Deregister the PGSmartphone
    requests.post(f'{env_config.webServer["url"]}:{env_config.webServer["port"]}/deregister',
                  data={"p_id": p_id, "do_id": do_id})

def bind_frame(p_id, do_id, d_id):
    # Bind the PortraitGuess
    print(f"Bind PortraitGuess {do_id} Successfully")
    api.device.bind(p_id, do_id, d_id, session=session)

def unbind_frame(p_id, do_id):
    # Unbind the PortraitGuess
    print(f"Unbind PortraitGuess {do_id} Successfully")
    api.device.unbind(p_id, do_id, session=session)