var cooldown_interval = 750;
var cooldown = true;

var higher_threshold = 35.0;
var lower_threshold = 20.0;

function deviceMotionHandler(event){
    if(acc_flag){
        sendAccData(event['accelerationIncludingGravity']);
    }
}

function get_sensor_data(){
    cooldown = true;
    acc_flag = true;
}

function stop_sensor_data(){
    acc_flag = false;
    console.log("successfully removeEventListener");
}

function clear_cooldown(){
    cooldown = true;
}

function sendAccData(raw_data){
    if(cooldown){
        let data = Math.sqrt(raw_data.x * raw_data.x + raw_data.y * raw_data.y + raw_data.z * raw_data.z);
        // console.log(data);

        if(data > higher_threshold){
            console.log("shake hard");
            cooldown = false;
            setTimeout(clear_cooldown, cooldown_interval);

            //removeEventListener
            stop_sensor_data();

            // sendResult("Correct");
            sendShakeData(raw_data);

            // start countdown
            lastClickTime = new Date();
        }
        else if (data > lower_threshold){
            console.log("shake light");
            cooldown = false;
            setTimeout(clear_cooldown, cooldown_interval);

            // sendResult("Wrong");
            sendShakeData(raw_data);

            // start countdown
            lastClickTime = new Date();
        }
    }
}
