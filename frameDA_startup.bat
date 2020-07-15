cd c:\Users\frame311\Riddle\server
START /B node server.js
timeout 3 > nul
cd c:\Users\frame311\FrameDA
START /B python DA_localsocket.py
timeout 3 > nul
cd c:\Users\frame311\FrameDA\IDA_painting
