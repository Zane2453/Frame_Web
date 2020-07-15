// modified 2019/9/3
function checknewgroup_addable(nameID){
    // modified 2019/9/4
    //let new_group_name = $("#groupModal_groupname").val();
    let new_group_name = $("#" + nameID).val();

    //check input
    if(new_group_name == null || $.trim(new_group_name) == ""){
        $("#groupModal_msg").text("請輸入群組名稱");
        return false;
    }

    for(let i = 0; i < group_list.length; i++){
        if(new_group_name == group_list[i].name){
            overwrite_id = group_list[i].id;
            // modified 2019/9/10
            show_confirmModal("cover");
            return false;
        }
    }

    // modified 2019/9/4
    if(nameID == "new_group_name")
        exec_add_new_group("set_new_group", "new_group_name", "group_table", "", "group");
    else
        addnewgroup_handler();
}

function addnewgroup_handler(){
    // modified 2019/9/4
    if ($("#confirmModal_confirm_btn").attr("del") == "upload"){
        new_group_name = $("#new_group_name").val();
    } else{
        new_group_name = $("#groupModal_groupname").val();  
    }

    let new_group_member = [],
        withmember = $("#groupModal_add").attr("member");
    
    /*//check input
    if($.trim(new_group_name) == ""){
        $("#groupModal_msg").text("請輸入群組名稱");
        return false;
    }

    for(let i = 0; i < group_list.length; i++){
        if(new_group_name == group_list[i].name){
            // modified 2019/8/29
            if (delete_group_id == group_list[i].id){
                $.ajax({
                    type: "DELETE",
                    url: location.origin + "/deleteGroup",
                    cache: false,
                    data: JSON.stringify(
                    {
                        delete_group_id : delete_group_id
                    }),
                    contentType: "application/json",
                    error: function(e){
                        $("#my_modal_backdrop").removeClass("my_modal_backdrop");
                        $("#confirmModal").modal("hide");
            
                        //show msgModal
                        show_msgModal("系統錯誤", "刪除群組失敗");
                        console.log(e);
                    }
                });
            } else{
                delete_group_id = group_list[i].id;
                $("#groupModal_msg").text("群組名稱重複，確定要新增嗎？");
                return false;
            }
        }
    }*/

    if(withmember == "true"){
        // console.log("good");
        $("#groupContent_table tr").each(function(idx){
            // console.log($(this).attr("question_id"));
            new_group_member.push({
                QuestionId: $(this).attr("question_id")
            });
        });
    }

    console.log(new_group_name);
    console.log(new_group_member);
    //ajax
    $.ajax({
        type: "POST",
        url: location.origin + "/addGroup",
        cache: false,
        data: JSON.stringify(
        {
            newgroup_name: new_group_name,
            newgroup_member: new_group_member
        }),
        contentType: "application/json",
        error: function(e){
            $("#classModal_msg").text("");
            $("#classModal").modal("hide");
            show_msgModal("系統錯誤", "新增群組 " + new_group_name + " 失敗");
            console.log(e);
        },
        success: function(payload){
            let data = JSON.parse(payload);
            console.log("create new class success, and its id: ", data.id);

            // modified 2019/9/4
            if ($("#confirmModal_confirm_btn").attr("del") == "upload"){
                show_msgModal("系統訊息", "群組 " + new_group_name + " 新增成功");
                $("#"+overwrite_id+"_checkbox").attr("checked", "checked");
                $("#"+overwrite_id+"_checkbox").attr("value", data.id);
            } else{
                // redirect group page
                location.href= location.origin + '/manage/group/' + data.id;
            }
        }
    });
}

function show_groupModal(withmember=false){
    if(withmember == true){
        $("#groupModal_title").text("另存群組");
        $("#groupModal_add").attr("member", "true");
    }
    else{
        $("#groupModal_title").text("新增群組");
        $("#groupModal_add").attr("member", "false");
    }

    $("#groupModal_groupname").val("");
    $("#groupModal_msg").text("");

    $("#groupModal").modal("show");
}

function close_groupModal(){
    $("#groupModal").modal("hide");
}

function show_msgModal(title, msg1, msg2=""){
    $("#my_modal_backdrop").addClass("my_modal_backdrop");
    $("#messageModal_title").text(title);
    $("#messageModal_body1").html(msg1);
    $("#messageModal_body2").html(msg2);
    $("#messageModal").modal("show");
}

function close_msgModal(){
    $("#my_modal_backdrop").removeClass("my_modal_backdrop");
    $("#messageModal").modal("hide");
}

function setupEditModal(questionData, status){
    let editModal_body_str = "",
        group_str = "",
        picture_str = "";

    //clear msg field
    $("#editModal_msg").html("");

    //render question group
    let group_list = questionData.group, 
        checked = "";
    for(let i = 0; i < group_list.length; i++){
        let id = group_list[i].id,
            name = group_list[i].name,
            used = group_list[i].used;
        
        //mark this group checked
        if(used)
            checked = "checked";
        else
            checked = "";

        group_str += "\
            <tr>\
                <td class='mycheckbox'><input type='checkbox' id='" + id + "_checkbox' name='editModalgroup' value='" + id + "' " + checked + "/></td>\
                <td><label for='" + id + "_checkbox'>" + name + "</label></td>\
            </tr>";
    }

    //render question picture
    let picture_list = questionData.picture,
        size_str = "";
    for(let i = 0; i < picture_list.length; i++){
        if(picture_list[i].size == 0)
            size_str = "&lt; 0 MB";
        else
            size_str = picture_list[i].size + " MB";

        picture_str += '\
            <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">\
                <span>' + size_str + '</span>\
                <img id="' + picture_list[i].src + '" src="/img/' + picture_list[i].src + '" size="' + picture_list[i].size + '" class="img-thumbnail"></img>\
                <span class="remove_tag"> ✖️ </span>\
            </div>';
    }

    /* check modal mode */
    let mode;
    if(status == "approved"){
        mode = "編輯";
        $("#editModal_update").text("儲存");
        $("#editModal_delete").hide();
    }
    else{
        mode = "審核";
        $("#editModal_update").text("通過");
        $("#editModal_delete").text("不通過");
    }

    /* set modal title and body */
    $("#editModalLabel_title").text(mode + "檔案");

    //set human info
    $('#editModal_name').val(questionData.name);
    $('#editModal_description').val(questionData.description);

    //set all category and mark those used
    $('#editModal_group_table').html(group_str);

    //set total img size
    //warning too large size
    $("#total_img_size").text(questionData.total_img_size);
    check_img_size(parseFloat(questionData.total_img_size));

    //set picture
    $('#editModal_picture_row').html(picture_str);
    $("#editModal_picture_row").sortable();
    $("#movable_pic_row").disableSelection();
}

function check_img_size(size){
    if(size >= 20.0){
        if(!$("#total_img_size").hasClass("warning")){
            $("#total_img_size").addClass("warning");
        }
    }
    else{
        if($("#total_img_size").hasClass("warning")){
            $("#total_img_size").removeClass("warning");
        }
    }
}

function remove_img(event){
    // the last pic cannot be deleted
    if($("#editModal_picture_row").find("img").length == 1){
        console.log("at least one picture to display!");
        $("#editModal_msg").html("至少需留下一張圖片！");
        return false;
    }
    else{ 
        //update total_img_size
        let $this = $(event.target),
            remove_size = $this.parent().find("img").attr("size"),
            total_img_size = $("#total_img_size").text(),
            new_total_img_size = Math.round((parseFloat(total_img_size) - parseFloat(remove_size)) * 100) / 100;

        //update warning size text
        $("#total_img_size").text(new_total_img_size);
        check_img_size(new_total_img_size);

        //remove img
        $this.parent().remove();
    }
}

function update_question(event, mode){
    // Get the data from input, create new FormData.
    let formData = new FormData(),
        question_id = $(event.target).attr("question_id"),
        name = $('#editModal_name').val(),
        description = $('#editModal_description').val(),
        img_order = {},
        data = {},
        selected_group = [],
        selected_group_str = "";

    //chech input
    if($.trim(name) == ''){
        $("#editModal_msg").html("檔案名稱必需填入");
        return false;
    }
    //add large img size restriction in mode "pending"
    if(mode == "pending"){
        let total_img_size = $("#total_img_size").text();
        if(parseFloat(total_img_size) >= 20.0){
            $("#editModal_msg").html("圖片總大小限制為20.0 MB，請刪除圖片以利遊戲進行");
            return false;
        }
    }

    let $selected_list = $('input[name=editModalgroup]:checked');
    if($selected_list.length == 0){
        selected_group_str = "不分類(預設)";
    }
    $selected_list.each(function(idx){
        selected_group.push($(this).val());
        if(idx == 0)
            selected_group_str = selected_group_str + $(this).parent().parent().find("label").text();
        else
            selected_group_str = selected_group_str + "，" + $(this).parent().parent().find("label").text();
    });

    //get img order
    $("#editModal_picture_row img").each(function(index){
        img_order[$(this).attr('id')] = index + 1;
    });
    console.log(img_order);

    //append data in formData
    data["id"] = question_id;
    data["name"] = name;
    data["description"] = description;
    data["selected_group"] = selected_group;
    data["img_order"] = img_order;
    console.log(data);

    //ajax
    $.ajax({
        type: "PUT",
        url: location.origin + "/updateQuestion",
        cache: false,
        data: JSON.stringify(
        {
            mode: "detail",
            user_update_data : data
        }),
        contentType: "application/json",
        error: function(e){
            $("#editModal_msg").html("[系統錯誤]<br>無法編輯檔案");
            console.log(e);
        },
        success: function(data){
            //close edit modal
            $('#editModal').modal("hide");

            //set new question info into pending/approved table
            $('#'+ question_id + '_row').find('td:first-child').text(name);
            $('#'+ question_id + '_row').find('td:nth-child(2)').text(selected_group_str);

            // update update_time
            let new_update_time = new Date();
            $('#'+ question_id + '_row td:nth-child(3)').text(new_update_time.toLocaleString());
        }
    });
}

function show_editModal(event, mode){
    let $this = $(event.target),
        question_id = $this.attr("question_id");
    console.log("checking: ", question_id);
    
    $.ajax({
        type: "GET",
        url: location.origin + "/getQuestion?question_id=" + question_id,
        cache: false,
        contentType: "application/json",
        error: function(e){
            show_msgModal("系統錯誤", "無法取得檔案資訊");
            console.log(e);
        },
        success: function(data){
            let questionData = JSON.parse(data);
            console.log(questionData);

            //set modal content by questionData
            setupEditModal(questionData, mode);

            //set question_id into delete(confirm) and update btn
            $("#editModal_delete").attr("question_id", question_id);
            $("#editModal_update").attr("question_id", question_id);

            //show edit modal
            $('#editModal').modal("show");
        }
    });
}

// modified 2019/9/10
function show_confirmModal(action){
    //popup confirmModal
    // modified 2019/9/3
    // del attribute "delete" means it caused by #group_delete_btn
    $("#my_modal_backdrop").addClass("my_modal_backdrop");
    if(action == "delete"){     
        $("#confirmModal_title").text("確定要刪除嗎？");
        $("#confirmModal_confirm_btn").attr("del", "delete");
    } else{
        $("#confirmModal_title").text("群組名稱重複，確定要覆蓋嗎？");
        // modified 2019/9/4
        if(location.pathname.split('/').indexOf("upload") == -1)
            $("#confirmModal_confirm_btn").attr("del", "group");
        else
            $("#confirmModal_confirm_btn").attr("del", "upload");
    }
    $("#confirmModal").modal("show");
}

function confirmModal_confirm_btn_handler(){
    // modified 2019/9/3
    if ($("#confirmModal_confirm_btn").attr("del") == "delete"){
        delete_group(group_item.id);
    } else {
        delete_group(overwrite_id);
    }
}

function close_confirmModal(){
    $("#confirmModal").modal("hide");
    $("#my_modal_backdrop").removeClass("my_modal_backdrop");
}

// modified 2019/9/3
function delete_group(delete_group_id){
    //ajax
    $.ajax({
        type: "DELETE",
        url: location.origin + "/deleteGroup",
        cache: false,
        data: JSON.stringify(
        {
            delete_group_id : delete_group_id
        }),
        contentType: "application/json",
        error: function(e){
            $("#my_modal_backdrop").removeClass("my_modal_backdrop");
            $("#confirmModal").modal("hide");

            //show msgModal
            show_msgModal("系統錯誤", "刪除群組失敗");
            console.log(e);
        },
        success: function(){
            // modified 2019/9/3
            if ($("#confirmModal_confirm_btn").attr("del") == "delete"){
                //set onclick function:back to hame for msgModal
                $("#messageModal_close_btn").attr("onclick", "go_homepage()");
                $("#messageModal_close_btn").text("回首頁");
                
                //show msgModal
                show_msgModal("系統訊息", "刪除群組成功");
            } else {
                close_confirmModal();
                addnewgroup_handler();
            }
        }
    });
}