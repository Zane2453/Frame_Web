from flask import Flask

from iottalkpy import dan
from config import IoTtalk_URL, device_model, device_name, device_addr, username

''' Initialize Flask '''
app = Flask(__name__)

if __name__ == "__main__":
    app.run()