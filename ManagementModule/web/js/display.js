$(function(){
    $(document).on("click", "#checkall", check_all_checkbox);
    $(document).on("click", "#set_display_btn", set_display_group);

    $(document).on("change", ".group_checkbox", show_set_btn);
    $("#set_display_btn").prop("disabled", true);
});

function show_set_btn(){
    $("#set_display_btn").prop("disabled", false);
}

function check_all_checkbox(){
    $("#set_display_btn").prop("disabled", false);
    $("input:checkbox[name='display']").prop("checked", $("#checkall").prop("checked"));
}

function set_display_group(){
    let $selected_group = $('input[name=display]:checked');
    let selected_group_list = [];

    $selected_group.each(function (){
        selected_group_list.push({
            id : $(this).val(),
            class_id : $(this).attr("class_id")
        });
    });
    
    console.log(selected_group_list);

    $.ajax({
        type: "PUT",
        url: location.origin + "/setDisplayGroup",
        cache: false,
        data: JSON.stringify(
        {
            selected_group_list : selected_group_list
        }),
        contentType: "application/json",
        error: function(e){
            show_msgModal("系統錯誤", "無法取得群組列表");
            console.log(e);
        },
        success: function(){
            // show_msgModal("系統訊息", "建立播放清單成功");
            $("#set_display_btn").prop("disabled", true);
        }
    });
}
