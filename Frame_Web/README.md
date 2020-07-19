# FrameTalk Web Mode
There is one part of FrameTalk system written in Web Mode: GameModule.
## Installation
- #### Required tools
  - install [python3](https://www.python.org/downloads/)
  - install [Yarn](https://classic.yarnpkg.com/)
  
- #### Required python packages
  - for GameModule
    ``` 
    cd FrameTalk_Web
    pip3 install -r requirement.txt
    ```

- #### Front-End Initial
  - ```
    cd frontend
    yarn install
    yarn build
    ```
    static directory and html templates will be created like below:
    ```
    frametalk
        |_Frame_Web
            |_static
            |_templates
    ```

- #### ManagementModule
  - DB & images initial:
    ```
    cd ManagementModule/web
    mkdir img
    cd ../server
    sudo node init_db.js
    ```
    
## Settings
 - #### GameModule
    1. ```cd FrameTalk_Web```
    2. set everything in 'config.py'
    
## How to start
- #### GameModule
    ```
    cd FrameTalk_Web
    python3 server.py
    ```

## CCM_API
1. Set CCM server URL
    ```python
    from ccmapi.v0.config import config as ccm_config
    
    ccm_config.api_url = '<path to IoTtalk server>/api/v0'
    ```
2. IoTtalk User Login API
    ```python
    import ccmapi.v0 as api
    
    import requests
    session = requests.Session()
    
    import getpass
    pw = getpass.getpass()
    # Key In Password 
    
    userid, cookie = api.account.login('username', pw, session=session)
    ```
3. IoTtalk Project API
    ```python
    # Get All Project Information
    api.project.get(session=session)
    
    # Create Project
    api.project.create('project_name', session=session)
    
    # Delete Project
    api.project.delete(project_id, session=session)
    
    # Get Project Information
    api.project.get(project_id, session=session)
    
    # Start Up Project
    api.project.on(project_id, session=session)
   
    # Shut Down Project
    api.project.off(project_id, session=session)
    ```
4. IoTtalk DeviceObject API
    ```python
    # Create DeviceObject
    api.deviceobject.create(project_id, device_model_name, device_feature_list, session=session)
    
    # Get DeviceObject Information
    api.deviceobject.get(project_id, device_object_id, session=session)
   
   # Delete DeviceObject 在 CCM API package 中還未封裝
    ```
5. IoTtalk NetworkApplication API
    ```python
    # Create NetworkApplication
    # 此 "join" 參數為  a list of "(device_object_id, device_feature_id or name)" pair
    api.networkapplication.create(project_id, joins, session=session)
    ```
6. IoTtalk Device Binding API
    ```python
    # DA Binding
    api.device.bind(project_id, device_object_id, device_id, session=session)
    
    # DA Unbinding
    api.device.unbind(project_id, device_object_id, session=session)
    ```

## AG CCM API Example
```python
import requests, json
requests.post('http://iottalk2.haohao.in:8080/autogen/ccm_api', data={"username": "iottalk","password":"iot2019","api_name": "project.create", "payload": json.dumps({"p_name":"Test_3"})})
```   

## Reference
- https://flask-socketio.readthedocs.io/en/latest/
- https://oawan.me/2016/javascript-json-stringify-and-parse/
- https://stackoverflow.com/questions/34009296/using-sqlalchemy-session-from-flask-raises-sqlite-objects-created-in-a-thread-c
- https://www.w3school.com.cn/jsref/jsref_split.asp
- https://flask-cors.readthedocs.io/en/latest/


