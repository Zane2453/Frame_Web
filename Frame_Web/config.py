class Config(object):
    host = 'localhost'
    port = '5000'
    csm_api = 'http://140.113.199.211:8080/csm'
    ccm_api = 'http://140.113.199.211:8080/api/v0'
    idm = {
        'name': 'PGSmartphone',
        'idf_list': [
            ['Acceleration', ['int', 'int', 'int']],
            ['Correct', ['int']],
            ['Name-I', ['string']],
            ['Play-I', ['string']],
            ['Wrong', ['int']]
        ],
        'odf_list': [
            ['PlayAck-O', ['string']]
        ],
    }
    odm = {
        'name' : 'PortraitGuess',
        'idf_list' : [
            ['PlayAck-I', ['string']]
        ],
        'odf_list' : [
            ['End', ['int']],
            ['Forward', ['int']],
            ['Mode', ['string']],
            ['Name-O', ['string']]
        ],
    }
    username = 'iottalk'
    pwd = 'iot2019'
    webServer = {
        'url': 'http://localhost',
        'port': 7788
    }
    manageServer = {
        'url': 'http://localhost',
        'port': 5566
    }
    # TODO: Reset the Path of Frame DB
    dbRoute = '../ManagementModule/server'

env_config = Config()