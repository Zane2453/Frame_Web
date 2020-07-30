import ccmapi.v0 as api
from ccmapi.v0.config import config as ccm_config
from iottalkpy.dan import Client

from config import env_config
import requests

ccm_config.api_url = env_config.ccm_api
session = requests.Session()

userid, cookie = api.account.login(env_config.username, env_config.pwd, session=session)

def create_frame(uuid):
    dev_name = f'Frame_{uuid}'
    p_id = api.project.create(dev_name, session=session)
    api.project.on(p_id, session=session)
    ido_id = api.deviceobject.create(p_id, 'PGSmartphone', ['PlayAck-O', 'Correct', 'Wrong', 'Name-I', 'Play-I', 'Acceleration'],session=session)
    odo_id = api.deviceobject.create(p_id, 'PortraitGuess', ['PlayAck-I', 'End', 'Forward', 'Name-O', 'Mode'],
                                     session=session)
    weather_id =api.deviceobject.create(p_id, 'Weather', ['Name-I'], session=session)

    na_id = api.networkapplication.create(p_id, [(ido_id, 'Acceleration'), (odo_id, 'Forward'), (odo_id, 'End')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'Correct'), (odo_id, 'End')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'Wrong'), (odo_id, 'Forward')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'Name-I'), (odo_id, 'Name-O')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'Play-I'), (odo_id, 'Mode')], session=session)
    api.networkapplication.create(p_id, [(ido_id, 'PlayAck-O'), (odo_id, 'PlayAck-I')], session=session)
    api.networkapplication.create(p_id, [(weather_id, 'Name-I'), (odo_id, 'Name-O')], session=session)

    na_info = api.networkapplication.get(p_id, na_id, session=session)

    dfm_list = []
    for index in na_info['input']:
        dfm_list.append({"dfo_id": index['dfo_id'], "dfmp_list": index['dfmp']})
    for index in na_info['output']:
        dfm_list.append({"dfo_id": index['dfo_id'], "dfmp_list": index['dfmp']})

    dfm_list[0]['dfmp_list'][0]['fn_id'] = 8
    dfm_list[1]['dfmp_list'][0]['fn_id'] = 20
    dfm_list[2]['dfmp_list'][0]['fn_id'] = 21

    api.networkapplication.update(p_id, na_id, dfm_list, 'Join1', session=session)

    return p_id, ido_id, odo_id, dev_name

def delete_frame(p_id):
    api.project.delete(p_id, session=session)

def bind_frame(p_id, do_id, d_id):
    api.device.bind(p_id, do_id, d_id, session=session)

def unbind_frame(p_id, do_id):
    api.device.unbind(p_id, do_id, session=session)

class DAI():
    def __init__(self, p_id, do_id, d_id):
        self.p_id = p_id
        self.do_id = do_id
        self.d_id = d_id
        self.dan = Client()

    def on_data(self, odf_name, data):
        print(f"[da] {odf_name}: {data}")
        requests.post(f'{env_config.webServer["url"]}:{env_config.webServer["port"]}/pull',data={"p_id": self.p_id, "data": data[0]})

    def on_signal(self, signal, df_list):
        print(f'[cmd] {signal} {df_list}')

    def on_register(self):
        print('[da] register successfully')

    def on_deregister(self):
        print('[da] register fail')

    def register(self):
        self.dan.register(
            env_config.csm_api,
            on_signal = self.on_signal,
            on_data = self.on_data,
            idf_list = env_config.idm['idf_list'],
            odf_list = env_config.idm['odf_list'],
            accept_protos = ['mqtt'],
            name = f"Smartphone_{self.d_id}",
            id_ = self.d_id,
            profile = {
                'model': env_config.idm['name']
            },
            on_register = self.on_register,
            on_deregister = self.on_deregister
        )
        
    def deregister(self):
        self.dan.deregister()

    def bind(self):
        api.device.bind(self.p_id, self.do_id, self.d_id, session=session)

    def push(self, idf, data):
        self.dan.push(idf, data)