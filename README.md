# FrameTalk v2
There are three parts in FrameTalk system: ManagementModule, WebServer, and GameModule.
## Installation
- #### Required tools
  1. install [node.js](https://nodejs.org/en/download/)
  2. install [python3](https://www.python.org/downloads/)
  3. install [processing](https://processing.org/download/)
- #### Required node.js modules
  - for ManagementModule
    ``` 
    cd FrameTalk/ManagementModule/server/
    npm install
    ``` 
  - for WebServer
    ``` 
    cd FrameTalk/WebServer/server/
    npm install
    ``` 
- #### Required python packages
  - for GameModule
    ``` 
    cd FrameTalk/GameModule/
    pip3 install requests qrcode Image
    ```
## Settings
 - #### ManagementModule
    1. ```cd FrameTalk/ManagementModule/server/```
    2. set everythin in 'config.js'
    3. generate default DB ```node init_db.js```
 - #### WebServer
    1. ```cd FrameTalk/WebServer/server/```
    2. set everything in 'config.js'
 - #### GameModule
    1. ```cd FrameTalk/GameModule/```
    2. set everything in 'config.py'
## How to start
- #### 1. WebServer
    ```
    cd FrameTalk/WebServer/server/
    node server.js
    ```
- #### 2. GameModule
  - 2-1 DA
    ```
    cd FrameTalk/GameModule/
    python3 dai.py
    ```
  - 2.2 Processing
    1. ```cd FrameTalk/GameModule/IDA_painting```
    2. use IDE to open 'IDA_painting.pde' and run
- #### 3. IoTtalk connection
  - open IoTtalk GUI
  - bind idf/odf
  - set join
- #### 4. ManagementModule (optional)
    ```
    cd FrameTalk/ManagementModule/server/
    node server.js
    ```
- #### 5. frame web version
    1. install [yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable)
    2. yarn install
    ```
    cd FrameTalk/WebServer/web/frame
    yarn install
    ```
    3. yarn build
    ```
    yarn build
    ```
    4. run server (Both client and frame will start)
    ```
    cd FrameTalk/WebServer/server
    node server.js
    ```