class EnvironmentConfig():
    IoTtalk_URL = 'https://iottalk2.tw/csm'
    device_model = 'PortraitGuess'
    device_name = 'Zane_Test'
    device_addr = 'd26c2fcc-15ef-4c75-a968-d36e8b21e138'
    username = 'iottalk'
    pwd = 'iot2019'

    idf_list = [
        ['PlayAck-I', ['string']]
    ]
    odf_list = [
        ['End', ['int']],
        ['Forward', ['int']],
        ['Mode', ['string']],
        ['Name-O', ['string']]
    ]

    webServerURL = 'http://localhost'
    webServerPort = 7788

    manageServerURL = 'http://localhost'
    manageServerPort = 5566

    dbRoute = '/Users/zane/FrameTalk/ManagementModule/server'

env_config = EnvironmentConfig()