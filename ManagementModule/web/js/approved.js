//main
$(function(){
    $(document).on("click", ".approvedbtn", function(event){ show_editModal(event, "approved"); });
    
    $(document).on("click", ".editModal_delete", function(event){ check_question_deletable(event); });

    $(document).on("click", ".remove_tag", function(event){ remove_img(event) });
    $(document).on("click", "#editModal_update", function(event){ update_question(event, "approved"); });

    $(document).on("keyup", "#search", function(event){ search_question(); });
    $(document).on("change", "#select", function(event){ search_question(); });

    $.ajax({
        type: "GET",
        url: location.origin + "/getGroupMember?group_id=all&status=1&info=detail",
        cache: false,
        contentType: "application/json",
        error: function(e){
            show_msgModal("系統錯誤", "無法進入'已審檔案'頁面");
            console.log(e);
        },
        success: function(payload){
            let data = JSON.parse(payload);
            console.log(data);

            question_list = data.question_list;
            render_approved_table(group_item, data.question_list);
        }
    });
});

function render_the_last_approved_row(){
    let msg = "\
        <tr class='row'>\
            <td class='col-md-3'>無檔案</td>\
            <td class='col-md-3'></td>\
            <td class='col-md-3'></td>\
            <td class='col-md-3'></td>\
        </tr>";
    if($("#approved_table").find('tr').length == 1){
        console.log('the last approved files');
        $("tbody").append(msg);
    }
}

function check_question_deletable(event){
    let question_id = $(event.target).attr("question_id"),
        name = $(event.target).parent().parent().find(".question_name").text();
    console.log("check ", question_id, " deletable...");

    //ajax
    $.ajax({
        type: "GET",
        url: location.origin + "/checkQuestionDeletable?question_id="+ question_id,
        cache: false,
        contentType: "application/json",
        error: function(e){
            $("#editModal_msg").html("[系統錯誤]<br>檔案無法刪除");
            console.log(e);
        },
        success: function(data){
            let response = JSON.parse(data);
            console.log(data);

            if(response.using){
                show_msgModal("系統訊息", name + " 無法刪除！<br>因所屬群組，正在播放清單中<br><br>您可編輯所屬群組，或是編輯播放清單，完成操作");
            }
            else{
                delete_approved_question(question_id);
            }
        }
    });
}

function delete_approved_question(id){
    //ajax
    $.ajax({
        type: "DELETE",
        url: location.origin + "/deleteQuestion",
        cache: false,
        data: JSON.stringify(
        {
            delete_question_id : id
        }),
        contentType: "application/json",
        error: function(e){
            $("#editModal_msg").html("[系統錯誤]<br>檔案無法刪除");
            console.log(e);
        },
        success: function(data){
            //remove this question from table
            $('#'+ id + "_row").remove();
            render_the_last_approved_row()
        }
    });
}

function render_approved_table(group_item, approved_list){
    let approved_table_str = "\
        <thead>\
            <tr class='row'>\
                <th class='col-md-3'>檔案名稱</th>\
                <th class='col-md-3'>群組</th>\
                <th class='col-md-3'>修改日期</th>\
                <th class='col-md-3'></th>\
            </tr>\
        </thead>";
    if(approved_list.length == 0){
        approved_table_str += "\
            <tr class='row'>\
                <td class='col-md-3'>無檔案</td>\
                <td class='col-md-3'></th>\
                <td class='col-md-3'></th>\
                <td class='col-md-3'></td>\
            </tr>";
    }

    approved_table_str += "<tbody class='approved_table'>";
    approved_list.forEach((approved_item) => {
        let id = approved_item.id,
            name = approved_item.name,
            description = approved_item.description,
            update_time = approved_item.update_time,
            group_name_list_str = get_group_name_str(approved_item.group_name_list);

        approved_table_str += '\
            <tr id="' + id + '_row" class="row question_row">\
                <td class="col-md-3 question_name">' + name + '</td>\
                <td class="col-md-3 group_name">' + group_name_list_str + '</td>\
                <td class="col-md-3 ">' + transUTCtoISOlocalStr(update_time) + '</td>\
                <td class="col-md-3">\
                    <button question_id="' + id + '" class="btn btn-secondary approvedbtn">內容</button>\
                    <button question_id="' + id + '" class="btn btn-danger editModal_delete">刪除</button></td>\
            </tr>';
    });
    approved_table_str += "</tbody>";

    $("#approved_table").html(approved_table_str);
}
