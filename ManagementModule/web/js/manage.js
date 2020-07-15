//main
$(function (){
    console.log("group_list:", group_list);
    console.log("pending_group_list:", pending_group_list);
    console.log("approved_group_list:", approved_group_list);
    console.log("group_item:", group_item);

    $(document).on("click", "#homepage_link_show_groupModal_btn", show_groupModal);
    // modified 2019/9/3, 2019/9/4
    $(document).on("click", "#groupModal_add", function(event){ checknewgroup_addable("groupModal_groupname"); });

    // modified 2019/9/3
    $(document).on("click", "#confirmModal_confirm_btn", function(event){ confirmModal_confirm_btn_handler(); }); // 刪除群組＿確定
    $(document).on("click", "#confirmModal_cancel_btn", function(event){ close_confirmModal(); });  //刪除群組＿取消

    // modified 2019/12/04
    $(document).on("click", "#timeout_btn", function(event){ resetTimeout(); });  //設定timeout

    $.ajax({ // get current timeout
        type: "GET",
        url: location.origin + "/getExpiredTime",
        cache: false,
        contentType: "application/json",
        error: function(e){
            console.log(e);
        },
        success: function(expired_time){
            $("#timeout_text").attr("placeholder", "ex: " + JSON.parse(expired_time));
        }
    });
});

// modified 2019/12/04
function resetTimeout(){
    let timeout_value = $("#timeout_text").val();
    if(timeout_value == null || $.trim(timeout_value) == ""){
        alert("Please Enter the Value!");
        return false;
    }

    $.ajax({
        type: "POST",
        url: location.origin + "/setExpiredTime",
        cache: false,
        data: JSON.stringify(
        {
            expired_time: timeout_value
        }),
        contentType: "application/json",
        error: function(e){
            console.log(e);
        },
        success: function(expired_time){
            $("#timeout_text").val("");
            $("#timeout_text").attr("placeholder", "ex: " + JSON.parse(expired_time));
        }
    });
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
            close_confirmModal();
            addnewgroup_handler();
        }
    });
}*/