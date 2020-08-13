var timeout = 50;
const optionLength = 5;
const chance = 5;
var lastClickTime; //record last click optionBtn time
var firstPlay = true;
var acc_flag = false;

var bar;    // Loading bar
var socket = io();
var uuid;
var groupList = {}, memberList = [], optionList = [];
var group_id, group_name;
var pre_answer_id = undefined;
var answer_idx, answer_description, answer_id, answer_name;
var chance_count = chance;
var nextPic = false;
var game_mode = undefined;
var expired_time = undefined;
var timeout_reason = undefined;

// control volume
var mute = 1;
$(document).ready(function(){
    $("#volume").click(function() {
        console.log("vol clicked");
      if(mute == 1){
          $("#volume").attr("src", "../icon/sound-on.png");
          mute = 0;
      }else{
          $("#volume").attr("src", "../icon/mute.png");
          mute = 1;
      }
    });
});

/* Game Control */
function init(){
    uuid = gen_uuid().substring(0, 5);
    sendPlayReq();
}

function gen_uuid(){
    let d = Date.now();

    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function auth(msg){
    if(uuid != msg.play_uuid){
        bar.animate(1.0);
        $("#loadingIndicator").hide();
        clearInterval(checkTimeout);
        displayHandler("alreadyAPlayerHtml");
        goEndPage();
    }
    else{
        if(firstPlay){
            firstPlay = false;
            bar.animate(1.0);
            groupList = msg.groupList;
            setTimeout(function(){
                $("#loadingIndicator").hide();
                $("#volume").show();
                displayMode();
            },1000);
        }
        else{
            displayMode();
        }
    }
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function checkResult(index){
    var wrongAudio = document.getElementById("wrongAudio");
    var correctAudio = document.getElementById("correctAudio");
    var answer_idxx = parseInt(answer_idx, 10);
    console.log("user click:", index, answer_idxx);
    if(index == answer_idxx){  // guess Correct
        if(mute == 0){
            correctAudio.play(); // play correct audio
        }
        console.log("good");

        chance_count = chance;
        $("#successAlert").html("You got it! I am");
        $("#successAlert").show();
        $("#successName").html(optionList[answer_idxx] + "<br>" + answer_description);
        $("#successName").show();
        $("#successImage").show();
        $("#failImage").hide();
        $("#wrongAlert").hide();
        $("#options").hide();
        $("#prompt").hide();
        $("#prompt2").hide();
        $("#prompt3").hide();
        $("#chance").hide();

        if(nextPic == true){
            sendGuessResult("Wrong");
            displayNextBtn();
        }
        else{
            sendGuessResult("Correct");
        }
    }
    else {  // guess Wrong
        if(mute == 0){
            wrongAudio.play(); // play wrong audio
        }
        chance_count--;
        if(chance_count <= 0){  // run out of guess chances
            console.log("suck");
            sendGuessResult("Correct");

            chance_count = chance;
            $("#successAlert").html("Oops... I am");
            $("#successAlert").show();
            $("#successName").html(optionList[answer_idxx] + '<br>' + answer_description);
            $("#successName").show();
            $("#failImage").show();
            $("#wrongAlert").hide();
            $("#options").hide();
            $("#prompt").hide();
            $("#prompt2").hide();
            $("#prompt3").hide();
            $("#chance").hide();
        }
        else {  // still with guess chances
            console.log("bad");
            sendGuessResult("Wrong");

            $("#wrongAlert").show();
            $("#chance").html("<span class='badge' style='background-color:blue;color:white'>" + chance_count + "</span> chances left");
            $("#chance").show();
            $("#prompt2").hide();
            $("#prompt3").hide();
            $("#successAlert").hide();
            $("#successName").hide();
            $("#successImage").hide();
            $("#failImage").hide();
        }
    }
}

function genOption(memberList, mode){
    let range;

    optionList = [];

    // shuffle memberList for randomlize
    memberList = shuffle(memberList);

    if(memberList.length > 5){ range = 5; }
    else{ range = memberList.length }

    //check memberList
    /*if(memberList.length < 3){
        nextPic = true;
    }*/
    console.log("genOption, nextPic:", nextPic);

    //pick all questions into optionList
    for(let i = 0; i < range; i++){
        optionList.push(memberList[i].name);
    }

    if(mode == "guess"){
        //random generate answer_idx
        answer_idx = Math.floor(Math.random() * range);

        //check if answer is duplicated
        while(pre_answer_id == memberList[answer_idx].id){
            if(range == 1) break;
            console.log("got duplicated answer !");
            answer_idx = Math.floor(Math.random() * range);
        }

        //get answer info
        answer_id = memberList[answer_idx].id;
        answer_name = memberList[answer_idx].name;
        answer_description = memberList[answer_idx].description;
        pre_answer_id = answer_id;

        console.log(optionList, answer_id, answer_name, answer_description, answer_idx);
        sendAnswer();
    }
}

function goEndPage(){
    socket.disconnect();
}

/* MsgHandler */
function sendPlayReq(){
    //1
    console.log("1. PlayReq", uuid);
    socket.emit("PlayReq", {
        "p_id": p_id,
        "uuid": uuid
    });
}

function recvPlayRes(){
    //2
    socket.on("PlayRes", function(msg){
        console.log("2. PlayRes", msg);
        auth(msg);
    });
}

function sendMode(){
    let tmp = game_mode == "guess" ? 0 : 1;
    //2.5
    socket.emit("Name-I", {
        "p_id": p_id,
        "type": "mode",
        "mode": tmp
    });
}

function sendMemberReq(){
    console.log("3. Name-I", group_name);
    //3 //10
    socket.emit("Name-I", {
        "p_id": p_id,
        "type": "group",
        "id": group_id,
        "name": group_name
    });
}

function recvMemberRes(){
    //4
    socket.on("MemberRes", function(msg){
        console.log("4. MemberRes", msg);
        memberList = msg;
        if(game_mode == "guess"){
            genOption(memberList, "guess");
            // sendAnswer();
        }
        else if(game_mode == "shake"){
            displayMember(memberList);
        }
    });
}

function sendAnswer(){
    //5
    console.log("5. Name-I", answer_name);
    socket.emit("Name-I", {
        "p_id": p_id,
        "type": "answer",
        "id": answer_id,
        "name": answer_name
    });
}

function recvLoading(){
    //6
    socket.on("Loading", function(msg){
        console.log("6. Loading", msg);
        if(msg.data == "finish"){
            hideProgressBar();
            if(game_mode == "guess"){
                displayOption(optionList, answer_idx, answer_description);
            }
            else if(game_mode == "shake"){
                chance_count = msg.picture_number - 1;
                displayShakeInfo();
            }
        }
    });
}

function sendGuessResult(status){
    if(status == "Correct"){
        //7
        console.log("7. Correct");
        socket.emit("Correct", {
            "p_id": p_id,
            "data": "1"
        });
    }
    else if(status == "Wrong"){
        //7
        console.log("7. Wrong");
        socket.emit("Wrong", {
            "p_id": p_id,
            "data": "1"
        });
    }
}

function sendShakeData(data){
    //7
    console.log("7. Acceleration");
    socket.emit("Acceleration", {
        "p_id": p_id,
        "data": [data.x, data.y, data.z]
    });
}

function recvDisplay(){
    //8
    socket.on("DisplayFinish", function(msg){
        console.log("8. DisplayFinish", msg);
        if(msg == "true"){
            $("#back_menu").hide();
            // $("#prompt6").hide();
            // $("#shakeImage").hide();
            $("#nextBtn").hide();

            $("#replayBtn").show().prop("disabled", false);
            $("#chooseGroupBtn").show().prop('disabled', false);
            $("#modeBtn").show().prop('disabled', false);
            $("#endBtn").show().prop('disabled', false);

            // modified 2020/08/07
            // set timeout
            if(game_mode == "guess"){
                timeout = expired_time["guess"]["end"];
            } else if(game_mode == "shake"){
                timeout = expired_time["shake"]["end"];
            }

            // set timeout reason
            timeout_reason = "未選擇下一步";
        }
    });
}

// modified 2020/08/07
function setTimer(){
    socket.on("Timer", function(msg){
        console.log("Timer: ", msg);
        expired_time = msg;
    });
}

$(function(){
    bar = new ProgressBar.Circle(loadingIndicator, {
        color: '#3cb371',
        strokeWidth: 4,
        trailWidth: 1,
        easing: 'easeInOut',
        duration: 500,
        text: {
          autoStyleContainer: false
        },
        from: { color: '#228b22', width: 1 },
        to: { color: '#3cb371', width: 4 },
        // Set default step function for all animate calls
        step: function(state, circle) {
              circle.path.setAttribute('stroke', state.color);
              circle.path.setAttribute('stroke-width', state.width);

              var value = Math.round(circle.value() * 100);
              if (value === 0) {
                circle.setText('');
              } else {
                circle.setText(value);
              }
            }
    });
    bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
    bar.text.style.fontSize = '5rem';
    bar.animate(0.5);  // Number from 0.0 to 0.5

    // start countdown
    lastClickTime = new Date();

    window.onpageshow = function (event) {
        if (event.persisted) {
            window.location.reload();
        }
    };
    if (!!window.performance && window.performance.navigation.type === 2) {
        // value 2 means "The page was accessed by navigating into the history"
        console.log('Reloading');
        window.location.reload(); // reload whole page
    }

    // add for Acceleration
    window.addEventListener('devicemotion', deviceMotionHandler, false);

    /*** main ***/
    init();
    recvPlayRes();
    recvMemberRes();
    recvLoading();
    recvDisplay();
    setTimer();
    $("#replayBtn").click(function replay(){
        // start countdown
        lastClickTime = new Date();

        if(game_mode == "guess"){
            showProgressBar()
            genOption(memberList, "guess");
        }
        else if(game_mode == "shake"){
            sendMemberReq();
        }
    });
    $("#chooseGroupBtn").click(function showGroup(){
        sendMode();
        displayGroup(groupList);
    });
    $("#modeBtn").click(function showMode(){
        sendPlayReq();
    });
    $("#endBtn").click(function end(){
        clearInterval(checkTimeout);
        displayHandler("gameEndHtml");
        goEndPage();
    });
    socket.on("disconnect", function(msg){
        console.log("ws close ", msg);
        //window.location = location.origin + "/endPage";
    });
    // modified 2020/07/31
    socket.on("End", function(){
        window.location = location.origin + "/endPage";
    });
    // timeout enter geEndPage()
    var checkTimeout = setInterval(function(){
        let now = new Date();
        if((now - lastClickTime)/1000 >= timeout){
            console.log("timeout");
            clearInterval(checkTimeout);
            displayHandler("timeoutHtml");
            goEndPage();
        }
    }, 1000);
});
