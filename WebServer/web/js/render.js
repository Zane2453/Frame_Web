function showProgressBar(){
    $("#my_modal_backdrop").addClass("my_modal_backdrop");
    $("#progressbarModal").addClass("manually-show-modal");
}

function hideProgressBar(){
    $("#my_modal_backdrop").removeClass("my_modal_backdrop");
    $("#progressbarModal").removeClass("manually-show-modal");
}

function hideall(){
    $(".function_btn").hide();
    $(".prompts").hide();
    $(".uls").hide();
    $("#wrongAlert").hide();
    $("#successName").hide();
    $("#successAlert").hide();
    $("#successImage").hide();
    $("#failImage").hide();
    $("#shakeImage").hide();
}

function displayMode(){
    hideall();

    $(".modeBtn").unbind('click');
    $(".modeBtn").click(function getMode(){
        game_mode = $(this).attr("mode");
        console.log("game mode:", game_mode);
        sendMode();
        displayGroup(groupList);
    });

    console.log("game page");
    $("#chance").hide();
    $("#prompt4").show();
    $("#mode_options").show();

    // start countdown
    lastClickTime = new Date();
}

function displayGroup(groupList){
    hideall();

    //generate group buttons
    let group_list_item_str = "";
    group_list_item_str += '<li><button class="groupBtn btn btn-secondary center-block my_li_btn">不分類</button></li>';
    for(let i in groupList.group){
        group_list_item_str += '<li><button group_id="' + groupList.group[i].id + '" class="groupBtn btn btn-secondary center-block my_li_btn">' + groupList.group[i].name + '</button></li>';
    }
    $("#group_options").html(group_list_item_str);

    //bind functions for group buttons
    $(".groupBtn").unbind('click');
    $(".groupBtn").click(function getGroup(){
        showProgressBar();

        if($(this).attr('group_id') == undefined){
            group_id = "all";
            group_name = "all";
        }
        else{
            group_id = $(this).attr('group_id');
            group_name = $(this).text();
        }

        sendMemberReq();
    });

    console.log("group page");
    $("#prompt3").show();
    $("#group_options").show();

    // start countdown
    lastClickTime = new Date();
}

function displayOption(optionList, answer_idx, answer_description){
    hideall();

    let option_str = "";
    for(let i = 0; i < optionList.length; i++){
        option_str += '<li><button class="optionBtn btn btn-danger center-block">' + optionList[i] + '</button></li>';
    }
    $("#options").html(option_str + '<li><button class="backBtn btn btn-primary center-block my_li_btn">返回主選單</button></li>');

    $(".optionBtn").unbind('click');
    $(".optionBtn").click(function getOpt(){
        lastClickTime = new Date();
        let index = $('.optionBtn').index(this);
        checkResult(index);
    });

    $(".backBtn").unbind('click');
    $(".backBtn").click(function backMenu(){
        lastClickTime = new Date();
        sendPlayReq();
    });

    $("#options").show();
    $("#prompt").show();
    $("#prompt2").show();
    $("#chance").html("<span class='badge' style='background-color:blue;color:white'>" + chance_count + "</span> chances left");
    $("#chance").show();
    console.log("session page");

    // start countdown
    lastClickTime = new Date();
}

function displayNextBtn(){
    $("#nextBtn").unbind('click');
    $("#nextBtn").click(function playNextPic(){
        console.log("before", chance_count);
        chance_count--;
        if(chance_count <= 0){
            $("#nextBtn").hide();
            chance_count = chance;
            nextPic = false;
            console.log("displayNextBtn", nextPic);
            console.log("after", chance_count);
            //7
            console.log("7. Correct");
            socket.emit("Correct", "1");
        }
        else{
            //7
            console.log("7. Wrong");
            socket.emit("Wrong", "1");
        }
    });

    $("#nextBtn").show();

    // start countdown
    lastClickTime = new Date();
}

function displayMember(memberList){
    hideall();

    let member_str = "";
    genOption(memberList, "shake");
    for(let i = 0; i < optionList.length; i++){
        member_str += '<li><button member_idx="' + i + '" class="memberBtn btn btn-danger center-block">' + optionList[i] + '</button></li>';
    }
    $("#member_options").html(member_str);

    $(".memberBtn").unbind('click');
    $(".memberBtn").click(function getMember(){
        showProgressBar();

        lastClickTime = new Date();

        let member_idx = parseInt($(this).attr('member_idx'), 10);
        answer_id = memberList[member_idx].id;
        answer_name = memberList[member_idx].name;
        answer_description = memberList[member_idx].description;

        sendAnswer();

        console.log(answer_id, answer_name, answer_description);
    });

    hideProgressBar();
    console.log("member page");
    $("#prompt5").show();
    $("#member_options").show();

    // start countdown
    lastClickTime = new Date();
}

// modified 2020/08/04
function displayShakeInfo(){
    hideall();

    chance_count = chance;

    console.log("sensor page");
    $("#back_menu").show();
    $("#prompt6").show();
    $("#shakeImage").show();

    $(".backBtn").unbind('click');
    $(".backBtn").click(function backMenu(){
        lastClickTime = new Date();
        sendPlayReq();
    });

    //read smartphone's sensor data
    get_sensor_data();
}

function set_sensor_handler(){
    if (typeof DeviceMotionEvent.requestPermission === 'function'){
        DeviceMotionEvent.requestPermission()
        .then(permissionState => {
            if (permissionState === 'granted'){
                window.addEventListener('devicemotion', deviceMotionHandler, false);
            }
        })
        .catch(console.error);
    }
}