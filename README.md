# FrameTalk v2
There are three parts in FrameTalk system: ManagementModule, WebServer, and GameModule.
## Installation
- #### Required tools
  1. install [node.js](https://nodejs.org/en/download/)
  2. install [python3](https://www.python.org/downloads/)
  3. install [Yarn](https://classic.yarnpkg.com/)
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
  - for GameServer
    ``` 
    cd FrameTalk/FrameTalk_Web/
    pip3 install -r requirement.txt
    ```
- #### Front-End Initial
  - ```
    cd FrameTalk/FrameTalk_Web/frontend
    yarn install
    yarn build
    ```
    static directory and html templates will be created like below:
    ```
    FrameTalk
        |_Frame_Web
            |_static
            |_templates
    ```
## Settings
 - #### ManagementModule
    1. ```cd FrameTalk/ManagementModule/server/```
    2. set everythin in 'config.js'
    3. generate default DB 
    ```
    cd FrameTalk/ManagementModule/web
    mkdir img
    cd FrameTalk/ManagementModule/server
    node init_db.js
    ```
 - #### WebServer
    1. ```cd FrameTalk/WebServer/server/```
    2. set everything in 'config.js'
 - #### GameServer
    1. ```cd FrameTalk/FrameTalk/FrameTalk_Web```
    2. set everything in 'config.py'
## How to start
- #### 1. WebServer
    ```
    cd FrameTalk/WebServer/server/
    node server.js
    ```
- #### 2. GameServer
    ```
    cd FrameTalk/FrameTalk_Web
    python3 server.py
    ```
- #### 3. ManagementModule
    ```
    cd FrameTalk/ManagementModule/server/
    node server.js
    ```
