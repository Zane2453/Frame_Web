//main
$(function(){
    // modified 2019/9/4
    //$(document).on("click", "#set_new_group", function(event){ exec_add_new_group("set_new_group", "new_group_name", "group_table", "", "group"); });
    $(document).on("click", "#set_new_group", function(event){ checknewgroup_addable("new_group_name"); });
    
    $(document).on("submit", "#upload-photos", function(event){ uplaod_btn_handler(event); });

    // modified 2019/9/4
    $(document).on("click", "#confirmModal_confirm_btn", function(event){ confirmModal_confirm_btn_handler(); }); // 刪除群組＿確定
    $(document).on("click", "#confirmModal_cancel_btn", function(event){ close_confirmModal(); });  //刪除群組＿取消

    make_img_movable();
});

//show movable img
function make_img_movable(){
    $("#upload_file").change(function(){
        //flush old files
        $(".preview_img").remove();

        //Preview upload image
        Array.from(this.files).forEach((file, idx) => {
            let div = $("<div>", {"class": "preview_img col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"});
            div.append($("<img>", {"id": "img" + idx, 
                    "class": "img-thumbnail", 
                    "oriname": file.name}));
            // div.append($("<span>", {"src": "/img/cancel.png", "class": "remove_tag", "text": "✖️"}));
            $("#movable_pic_row").append(div);

            //load image
            let reader = new FileReader();
            reader.onload = function (event) {
                $("#img" + idx).attr("src", event.target.result);
            };
            reader.readAsDataURL(file);
        });
    });
    
    //make image movable
    $( "#movable_pic_row" ).sortable();
    $( "#movable_pic_row" ).disableSelection();
}

//upload btn handler
function uplaod_btn_handler(event){
    //prevent form auto redirect after submit
    event.preventDefault();

    // Get the data from input, create new FormData.
    let formData = new FormData(),
        files = $('#upload_file').get(0).files,
        name = $('#name').val(),
        description = $('#description').val(),
        img_order = {},
        data = {},
        selected_group = [];

    //chech input
    if($.trim(name) == ''){
        show_msgModal("系統訊息", "請填入名字");
        return false;
    }
    else if(files.length < 1){ //check file input
        show_msgModal("系統訊息", "至少需要上傳 1 張圖片");
        return false;
    }

    let $selected_list = $('input[name=group]:checked');
    //push selected groups
    $selected_list.each(function(){
        selected_group.push({
            group_id : $(this).val()
        });
        console.log($(this).val());
    });

    //get img order
    $("img").each(function(index){
        img_order[$(this).attr('oriname')] = index + 1;
    });
    console.log(img_order);

    //append data in formData
    data["name"] = name;
    data["description"] = description;
    data["img_order"] = img_order;
    data["selected_group"] = selected_group;
    formData.append("user_upload_data", JSON.stringify(data));

    for(let i = 0; i < files.length; i++){
        let file = files[i];
        if(file.name == ".DS_Store"){
            show_msgModal("系統訊息", "無法上傳檔案<br>圖片檔案不支援<br>僅限圖片為: png, jpeg, jpg");
            return false;
        }
        formData.append('photos[]', file, file.name);
    }
    console.log("upload:", data);

    // show progressbar
    $("#my_modal_backdrop").addClass("my_modal_backdrop");
    $("#progressbarModal").addClass("manually-show-modal");

    //ajax
    $.ajax({
        url: '/uploadQuestion',
        method: 'post',
        data: formData,
        processData: false,
        contentType: false,
    }).done(handleUploadSuccess).fail(function (xhr, status) {
        //close progressbar
        $("#my_modal_backdrop").removeClass("my_modal_backdrop");
        $("#progressbarModal").removeClass("manually-show-modal");
        show_msgModal("系統錯誤", "無法上傳檔案");
    });
}


//upload success handler
function handleUploadSuccess(data){
    let res = JSON.parse(data);
    console.log(res.photo_status);

    //close progressbar
    $("#my_modal_backdrop").removeClass("my_modal_backdrop");
    $("#progressbarModal").removeClass("manually-show-modal");

    if(res.photo_status){
        //show msgModal with selected_group
        let selected_group = "",
            $selected_list = $('input[name=group]:checked');
        if($selected_list.length == 0){
            selected_group += " 不分類(預設)";
        }
        else{
            $selected_list.each(function(idx){
                console.log(idx);
                // console.log($(this).parent().parent().find('label').text());
                if(idx == 0) selected_group = selected_group + $(this).parent().parent().find('label').text();
                else         selected_group = selected_group + "，" + $(this).parent().parent().find('label').text();
            });
        }
        show_msgModal("系統訊息", "上傳檔案成功", "加入至群組：" + selected_group);

        // clear all input
        $('#upload_file').val('');
        $('#name').val('');
        $('#description').val('');
        $(".preview_img").remove();
        $('input[name=group]:checked').prop("checked", false);
        $("#collapseExample").removeClass("show");
    }
    else{
        //show msgModal
        show_msgModal("系統訊息", "上傳檔案失敗<br>圖片檔案不支援<br>僅限圖片為: png, jpeg, jpg");
    }
}
