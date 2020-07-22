from datetime import datetime
import time, requests, threading, json
import uuid

api_url = 'https://iottalk2.tw/csm'  # default
device_name = 'Weather_DA'
device_model = 'Weather'

### The input/output device features, please check IoTtalk document.
idf_list = ['Name-I']
odf_list = []

DAN = None

Name_I = None

def on_register(dan):
    global DAN
    DAN = dan
    t1 = threading.Thread(target=getWeather)
    t2 = threading.Thread(target=pushWeather)
    t1.daemon = True
    t1.start()
    t2.daemon = True
    t2.start()
    print('[da] register successfully')

def on_deregister():
    print('[da] register fail')

# MIRC311 Hsinchu
lat = '24.6742'
lon = '121.1611'

global condition  # weather condition
condition = 'rain'  # default

def pushWeather():
    for i in range(30):
        try:
            DAN.push('Name-I', condition)
            print(datetime.now().isoformat(), ' , weather condition = ', condition)
            time.sleep(2)

        except Exception as e:
            print(e)

def getWeather():
    while True:
        try:
            #res = requests.get("http://api.openweathermap.org/data/2.5/weather?units=metric&appid=7193376830b573b984686c168c63e3ab&q=" + loc)
            res = requests.get("http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon +"&appid=7193376830b573b984686c168c63e3ab")
            if  res.status_code == requests.codes.ok:
                weather_data = res.json()

            icon = weather_data['weather'][0]['icon']
            if icon in ['01d', '01n']:
                condition = 'clear sky'
            elif icon in ['02d', '02n']:
                condition = 'few clouds'
            elif icon in ['03d', '03n']:
                condition = 'scattered clouds'
            elif icon in ['04d', '04n']:
                condition = 'broken clouds'
            elif icon in ['09d', '09n']:
                condition = 'shower rain'
            elif icon in ['10d', '10n']:
                condition = 'rain'
            elif icon in ['11d', '11n']:
                condition = 'thunderstorm'
            elif icon in ['13d', '13n']:
                condition = 'snow'
            elif icon in ['50d', '50n']:
                condition = 'mist'

            #condition =  weather_data['weather'][0]['main']
            #condition =  weather_data['weather'][0]['description']
            DAN.push('Name-I', condition)
            print(datetime.now().isoformat() , ' icon = ', icon, ' , weather updated, condition = ', condition)

        except:
            print('Get weather failed')

        time.sleep(600)
