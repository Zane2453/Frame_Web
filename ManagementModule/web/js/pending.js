//main
var group_dict = {};

$(function(){
    $(document).on("click", ".pendingbtn", function(event){ show_editModal(event, "pending"); });
    
    $(document).on("click", ".quick_update", function(event){ quick_update_question(event); });
    $(document).on("click", ".editModal_delete", function(event){ delete_pending_question(event); });

    $(document).on("click", ".remove_tag", function(event){ remove_img(event) });
    $(document).on("click", "#editModal_update", function(event){ update_question(event, "pending"); });

    for(let i = 0; i < group_list.length ; i++){
        group_dict[group_list[i].id] = group_list[i].name;
    }

    $.ajax({
        type: "GET",
        url: location.origin + "/getGroupMember?group_id=all&status=0&info=detail",
        cache: false,
        contentType: "application/json",
        error: function(e){
            show_msgModal("系統錯誤", "無法進入'待審檔案'頁面");
            console.log(e);
        },
        success: function(payload){
            let data = JSON.parse(payload);
            console.log(data);

            question_list = data.question_list;
            render_pending_table(group_item, data.question_list);
        }
    });
});

function render_the_last_pending_row(){
    //display no more pending files in this class
    let msg = "\
        <tr class='row'>\
            <td class='col-md-3'>檔案皆以審核完畢</td>\
            <td class='col-md-3'></td>\
            <td class='col-md-3'></td>\
            <td class='col-md-3'></td>\
        </tr>";
    if($("#pending_table").find('tr').length == 1){
        console.log('the last pending files');
        $("tbody").append(msg);
    }
}

function delete_pending_question(event){
    let id = $(event.target).attr("question_id");

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
            render_the_last_pending_row();

            $('#editModal').modal("hide");
        }
    });
}

function quick_update_question(event){
    let question_id = $(event.target).attr("question_id");
    console.log(question_id);

    //ajax
    $.ajax({
        type: "PUT",
        url: location.origin + "/updateQuestion",
        cache: false,
        data: JSON.stringify(
        {
            mode: "simple",
            user_update_data: {id: question_id}
        }),
        contentType: "application/json",
        error: function(e){
            $("#editModal_msg").html("[系統錯誤]<br>無法編輯檔案");
            console.log(e);
        },
        success: function(data){
            // update update_time
            let new_update_time = new Date();
            $('#'+ question_id + '_row td:nth-child(3)').text(new_update_time.toLocaleString());
        }
    });
}

function render_pending_table(group_item, pending_list){
    let pending_table_str = "\
        <thead>\
            <tr class='row'>\
                <th class='col-md-3'>檔案名稱</th>\
                <th class='col-md-3'>群組</th>\
                <th class='col-md-3'>上次通過</th>\
                <th class='col-md-3'></th>\
            </tr>\
        </thead>";

    if(pending_list.length == 0){
        pending_table_str += "\
            <tr class='row'>\
                <td class='col-md-3'>檔案皆以審核完畢</td>\
                <td class='col-md-3'></td>\
                <td class='col-md-3'></td>\
                <td class='col-md-3'></td>\
            </tr>";
    }

    pending_table_str += "<tbody class='approved_table'>";
    pending_list.forEach((pending_item) => {
        let id = pending_item.id,
            name = pending_item.name,
            description = pending_item.description,
            update_time = pending_item.update_time,
            group_name_list_str = get_group_name_str(pending_item.group_name_list);

        pending_table_str += '\
            <tr id="' + id + '_row" class="row">\
                <td class="col-md-3">' + name + '</td>\
                <td class="col-md-3">' + group_name_list_str + '</td>\
                <td class="col-md-3">' + transUTCtoISOlocalStr(update_time) + '</td>\
                <td class="col-md-3">\
                    <button question_id="' + id + '" class="btn btn-secondary pendingbtn">內容</button>\
                    <button question_id="' + id + '" class="btn btn-primary quick_update">通過</button>\
                    <button question_id="' + id + '" class="btn btn-danger editModal_delete">不通過</button>\
                </td>\
            </tr>';
    });
    pending_table_str += "</tbody>";

    $("#pending_table").html(pending_table_str);
}
