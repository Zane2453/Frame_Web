function exec_add_new_group(btnId, nameId, tableId, rowId, checkboxname){
    let new_group_name = $("#" + nameId).val();
    // modified 2019/9/4
    /*console.log(new_group_name);
    if(new_group_name == null || $.trim(new_group_name) == ''){
        //show msgModal
        show_msgModal("系統訊息", "請輸入群組名稱");
        return false;
    }
    else if($('#' + tableId + ' label:contains("' + new_group_name + '")').length){
        //show msgModal
        show_msgModal("系統訊息", "群組名稱不得重複");
        return false;
    }*/
    //else{
        //create new category in db
        $.ajax({
            type: "POST",
            url: location.origin + "/addGroup",
            cache: false,
            data: JSON.stringify(
            {
                newgroup_name : new_group_name
            }),
            contentType: "application/json",
            error: function(e){
                //show msgModal
                show_msgModal("系統錯誤", "無法新增群組");
                console.log(e);
            },
            success: function(payload){
                let new_group_item = JSON.parse(payload);
                console.log("new_group", new_group_item);

                render_new_group_tablerow(tableId, new_group_item, checkboxname);

                //show msgModal
                show_msgModal("系統訊息", "群組 " + new_group_name + " 新增成功");
                $("#" + nameId).val("");
                //$("#" + btnId).show();
            }
        });
    //}
}

function render_new_group_tablerow(table_id, new_group_item, checkboxname){
    let new_id = new_group_item.id,
        new_name = new_group_item.name,
        newGroupTableRow = "";

    console.log(new_id, new_name);
    newGroupTableRow += "\
        <tr>\
            <td class='mycheckbox'><input type='checkbox' id='" + new_id + "_checkbox' name='" + checkboxname + "' value='" + new_id + "' checked/></td>\
            <td><label for='" + new_id + "_checkbox'>" + new_name + "</label></td>\
        </tr>";

    // console.log(newGroupId, newGroupName);

    //check if tbody is existed
    let $table_id = "#" + table_id;
    if($($table_id).find('tbody').length){
        $($table_id).find('tbody').append(newGroupTableRow);
    }
    else{
        $($table_id).append(newGroupTableRow);
    }
}

function get_group_name_str(group_name_list){
    let group_name_str = "",
        comma = "";

    if(group_name_list.length == 0){
        group_name_str = "不分類(預設)";
    }

    group_name_list.forEach((group_name, idx) => {
        if(idx == 0) 
            comma = "";
        else 
            comma = "，";

        group_name_str = group_name_str + comma + group_name;
    });

    return group_name_str;
}

function transUTCtoISOlocalStr(UTCtime_str){
    let myTime = new Date(UTCtime_str).toLocaleString();
    return myTime;
}

function search_name(question_name, search_val){
    //[TODO] check charactor is chinese or english
    //now manually split chinese and english by token ","
    let token_list = question_name.toLowerCase().split(",");
    search_val = search_val.toLowerCase();
    for(let i = 0 ; i < token_list.length; i++){
        if($.trim(token_list[i]).startsWith(search_val) == true){
            return true;
        }
    }

    return false;
}

function search_group(group_name, select_val){
    return group_name.indexOf(select_val) != -1;
}

function search_question(){
    let search_val = $.trim($("#search").val()),
        select_id = $('option:selected').attr('group_id'),
        condition, condition_search, condition_select;

    $(".question_row").each(function(idx, row){
        condition_search = search_name($(row).children('.question_name').text(), search_val);
        condition_select = search_group($(row).children('.group_name').text(), $("#select").val());
        
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

        if(condition){
            $(row).show();
        }
        else{
            $(row).hide();
        }
    });
}
