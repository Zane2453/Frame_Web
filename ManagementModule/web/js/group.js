//main
var groupmember_dict = {};

$(function(){
    $(document).on("click", "#show_name_div_btn", function(event){ show_name_div(); }); // 修改名稱
    $(document).on("click", "#update_name_btn", function(event){ update_groupname(); });    // 儲存名稱
    $(document).on("click", "#show_member_div_btn", function(event){ show_member_div(); }); // 編輯成員
    $(document).on("click", "#save_member_btn", function(event){ save_member(); }); // 儲存群組
    // modified 2019/9/2
    $(document).on("click", "#save_as_new_group_btn", function(event){ show_groupModal(true); });   // 另存群組

    $(document).on("click", "#group_delete_btn", function(event){ check_group_deletable(); });  // 刪除群組
    // modified 2019/9/3
    $(document).on("click", "#confirmModal_confirm_btn", function(event){ confirmModal_confirm_btn_handler(); }); // 刪除群組＿確定
    $(document).on("click", "#confirmModal_cancel_btn", function(event){ close_confirmModal(); });  //刪除群組＿取消

    $(document).on("click", "#add_member_btn", function(event){ add_member(event); });  // 加入成員
    $(document).on("click", "#delete_member_btn", function(event){ delete_member(event); });    // 移除成員

    $(document).on("click", ".add_checkbox", function(event){ show_add_btn(event); });
    $(document).on("click", ".delete_checkbox", function(event){ show_delete_btn(); });
    $(document).on("click", "#delete_all_checkbox", function(event){ check_all_delete_ckeckbox(event); });
    $(document).on("click", "#add_all_checkbox", function(event){ check_all_add_ckeckbox(event); });

    $(document).on("keyup", "#search", function(event){ search_question(); });  // 搜尋檔案欄位
    $(document).on("change", "#select", function(event){ search_question(); }); // 選擇群組欄位

    //get group member
    $.ajax({
        type: "GET",
        url: location.origin + "/getGroupMember?group_id=" + group_item.id + "&status=1&info=detail",
        cache: false,
        contentType: "application/json",
        dataType: 'json',
        error: function(e){
            show_msgModal("系統錯誤", "無法進入'編輯群組'頁面");
            console.log(e);
        },
        success: function(payload){
            let data = payload
            console.log(data);

            for(let idx in data.question_list){
                // console.log(data.question_list[idx].id, data.question_list[idx].name);
                groupmember_dict[data.question_list[idx].id] = {
                    name: data.question_list[idx].name,
                    group_name_list: get_group_name_str(data.question_list[idx].group_name_list)
                };
            }
            console.log(groupmember_dict);

            render_groupinfo(group_item.name, data.question_list);

            //get candidate questions
            get_candidate_table();

            //show name
            if(group_item.status == 1){
                $("#title_group_name").text(group_item.name + "(播放中)");
            }
            else{
                $("#title_group_name").text(group_item.name);
            }
        }
    });
});
/* modified 2019/9/2
function save_as_new_group(){
    //show modal
    show_groupModal(true);
}*/

function show_name_div(){
    if($('#name_div').css("visibility") == "hidden"){
        $('#name_div').css("visibility", "visible");
    }
    else {
        $('#name_div').css("visibility", "hidden");
    }
}

function show_member_div(){
    if($('#old_member_div').css("visibility") == "hidden"){
        $('#old_member_div').css("visibility", "visible");
        $('#new_member_div').css("visibility", "visible");
    }
    else {
        $('#old_member_div').css("visibility", "hidden");;
        $('#new_member_div').css("visibility", "hidden");
    }
}

function save_member(){
    let newgroupmember_list = [],
        $selected_list = $("#groupContent_table tr");
    
    //push selected groups
    $selected_list.each(function(){
        newgroupmember_list.push({
            question_id: $(this).attr('question_id')
        });
    });
    console.log(newgroupmember_list);

    //ajax
    $.ajax({
        type: "PUT",
        url: location.origin + "/updateGroup",
        cache: false,
        data: JSON.stringify(
        {
            mode: "update_member",
            update_group_id: group_item.id,
            group_list: newgroupmember_list
        }),
        contentType: "application/json",
        error: function(e){
            show_msgModal("系統錯誤", "編輯群組失敗");
            console.log(e);
        },
        success: function(){
            //close edit area
            show_member_div();

            // show_msgModal("系統訊息", "新增成功");
        }
    });
}

function append_group_member_row(id, name){
    //remove the first_msg_row
    $('#groupContent_table').find('label').each(function(){
    if($(this).attr("question_id") == "none"){
            $(this).parent().parent().remove();
        }
    });

    let groupContent_str = '\
        <tr class="row" question_id="' + id + '">\
            <td class="col-md-1 mycheckbox">\
                <input type="checkbox" id="' + id + '_checkbox" class="delete_checkbox" name="member_delete" value="' + id + '" />\
            </td>\
            <td class="col-md-11">\
                <label for="' + id + '_checkbox">' + name + '</label>\
            </td>\
        </tr>';
    $("#groupContent_table").append(groupContent_str);
}

function remove_group_member_row($row){
    $row.remove();

    // console.log($("#groupContent_table").find("tr").length);
    if($("#groupContent_table").find("tr").length == 0){
        $("#groupContent_table").html('\
            <tr class="row">\
                <td class="col-md-2"></td>\
                <td class="col-md-10">\
                    <label question_id="none">群組尚內無成員</label>\
                </td>\
            </tr>');
    }
}

function check_all_delete_ckeckbox(event){
    let checked = $(event.target).prop('checked');
    $("input:checkbox[name='member_delete']").prop("checked", checked);
    
    show_delete_btn();
}

function show_delete_btn(){
    if($("input:checkbox[name='member_delete']:checked").length > 0){
        $("#delete_member_btn").show();
    }
    else{
        $("#delete_member_btn").hide();
    }
}

function check_all_add_ckeckbox(event){
    let checked = $(event.target).prop('checked');
    $("input:checkbox[name='member_add']").prop("checked", checked);
    
    show_add_btn();
}

function show_add_btn(event){
    if($("input:checkbox[name='member_add']:checked").length > 0){
        $("#add_member_btn").show();
    }
    else{
        $("#add_member_btn").hide();
    }
}

function append_candidate_row(id, name, group_name_list_str, display=true){
    let candidate_row_str = '\
        <tr class="row question_row">\
            <td class="col-md-1 mycheckbox">\
                <input type="checkbox" id="' + id + '_checkbox" class="add_checkbox" name="member_add" value="' + id + '">\
            </td>\
            <td class="col-md-4 question_name">\
                <label for="' + id + '_checkbox" >' + name + '</label></td>\
            </td>\
            <td class="col-md-7 group_name">' + group_name_list_str + '</td>\
        </tr>\
    ';

    let candidate_row = $(candidate_row_str);
    if(display == false){
        candidate_row.hide();
    }

    $("#candidate_table").append(candidate_row);
}

function remove_candidate_row($tbody, $row){
    $row.remove();
}

function render_groupinfo(group_title, question_list){
    if(typeof question_list !== 'undefined' && question_list.length > 0){
        question_list.forEach((content) => {
            append_group_member_row(content.id, content.name);
        });
    }
    else{
        $("#groupContent_table").html('<tr class="row"><td class="col-md-1"></td><td class="col-md-11"><label question_id="none">群組尚內無成員</label></td></tr>');
    }

    $("#group_title").val(group_title);
}

function add_member(event){
    let newgroupmember_list = [],
        $selected_list = $('input[name=member_add]:checked');

    let $label, question_id, name, group_id_list_str, $table, $row;

    //close add_member_btn
    $("#add_member_btn").hide();

    //deal with card_member
    $selected_list.each(function(){
        $table = $(this).parent().parent().parent();
        $row = $(this).parent().parent();
        $label = $row.find("label");
        question_id = $(this).val();
        name = $label.text();
        group_name_list_str = $row.find(".group_name").text();
        console.log(group_name_list_str);

        //push into groupmember_dict
        groupmember_dict[question_id] = {
            name: name,
            group_name_list: group_name_list_str
        };

        //remove from card
        remove_candidate_row($table, $row);

        //append on groupmember_row/
        append_group_member_row(question_id, name);
    });
}

function delete_member(event){
    let deletegroupmember_list = [],
        $selected_list = $('input[name=member_delete]:checked'),
        $member_list = $('input[name=member_delete]');

    //make sure playing group has at least one member to play
    if(group_item.status == 1){
        if($selected_list.length == $member_list.length){
            show_msgModal("系統訊息", "移除失敗<br>播放中的群組，至少需選取 1 個成員");
            return false;
        }
    }

    let $label, question_id, name, $row, show_flag;

    //close delete_member_btn
    $("#delete_member_btn").hide();

    //deal with groupmember_row
    $selected_list.each(function(){
        $row = $(this).parent().parent();
        question_id = $(this).val();
        $label = $row.find("label");
        name = $label.text();
        
        //remove from groupmember_row
        remove_group_member_row($row);

        //check question is able to show under now search condition
        show_flag = check_row_showable(name, groupmember_dict[question_id].group_name_list);

        //add it back to candidate table
        append_candidate_row(question_id, name, groupmember_dict[question_id].group_name_list, show_flag);

        //remove from groupmember_dict
        if(groupmember_dict.hasOwnProperty(question_id)){
            delete groupmember_dict[question_id]
        }
    });
}

function check_row_showable(question_name, group_name_list_str){
    let search_val = $.trim($("#search").val()),
        select_id = $('option:selected').attr('group_id'),
        condition, condition_search, condition_select;

    condition_search = search_name(question_name, search_val);
    condition_select = search_group(group_name_list_str, $("#select").val());
    
    if(search_val == ""){
        if(select_id == "default"){ //[case:1] show all
            condition = true;
        }
        else{ //[case:2] only select_val
            condition = condition_select;
        }
    }
    else{
        if(select_id == "default"){ //[case:3] only search_val
            condition = condition_search;
        }
        else{ //[case:4] search_val and select_val
            condition = condition_search && condition_select;
        }
    }

    return condition;
}

function check_group_deletable(){
    if(group_item.status == 1){
        show_msgModal("系統訊息", "群組 " + $("#group_title").val() + " ，無法刪除<br>因其正在播放中<br>您可至'播放清單'頁面，將其取消勾選，完成操作");
    }
    else{
        // modified 2019/9/10
        show_confirmModal("delete");
    }
}

// modified 2019/9/3
/*function delete_group(delete_group_id){
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
            if ($("#confirmModal_confirm_btn").attr("del") == "true"){
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
}*/

function go_homepage(){
    location.replace(location.origin + '/manage');
}

function update_groupname(){
    let update_group_name = $('#group_title').val();

    //check name input
    if($.trim(update_group_name) == ""){
        show_msgModal("系統訊息", "請填入群組名稱");
        return false;
    }
    //check duplicate name
    for(let i = 0; i < group_list.length; i++){
        if(update_group_name == group_list[i].name){
            if(group_item.id != group_list[i].id){
                show_msgModal("系統訊息", "群組名稱不得重複");
                return false;
            }
        }
    }

    //ajax
    $.ajax({
        type: "PUT",
        url: location.origin + "/updateGroup",
        cache: false,
        data: JSON.stringify(
        {
            mode: "new_name",
            update_group_id: group_item.id,
            update_group_name: update_group_name,
        }),
        contentType: "application/json",
        error: function(e){
            show_msgModal("系統錯誤", "編輯群組失敗");
            console.log(e);
        },
        success: function(){
            //update newname into group_list
            for(let i = 0; i < group_list.length; i++){
                if(group_item.id == group_list[i].id){
                    group_list[i].name = update_group_name;
                }
            }

            // show_msgModal("系統訊息", "儲存成功");
            if(group_item.status == 1){
                $("#title_group_name").text(update_group_name + "(播放中)");
            }
            else{
                $("#title_group_name").text(update_group_name);
            }
            $('#name_div').css("visibility", "hidden");
        }
    });
}

function get_candidate_table(){
    $.ajax({
        type: "GET",
        url: location.origin + "/getGroupMember?group_id=all&status=1&info=detail",
        cache: false,
        contentType: "application/json",
        error: function(e){
            show_msgModal("系統錯誤", "無法取得'已審檔案'");
            console.log(e);
        },
        success: function(payload){
            let data = JSON.parse(payload);
            console.log(data);

            question_list = data.question_list;
            render_candidate_table(data.question_list);
        }
    });
}

function render_candidate_table(question_in_group_list){
    question_in_group_list.forEach((question) => {
        //filter duplicate
        if(groupmember_dict.hasOwnProperty(question.id)){
            console.log("filter", question.name);
            return;
        }

        append_candidate_row(question.id, question.name, get_group_name_str(question.group_name_list))
    });
}
