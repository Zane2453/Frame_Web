//main
$(function(){
    $(document).on("click", "nav li", set_navbar_tab_active_handler);
    $(document).on("click", "#dropdown-show-groupModal-btn", show_groupModal);
    // modified 2019/9/3, 2019/9/4
    $(document).on("click", "#groupModal_add", function(event){ checknewgroup_addable("groupModal_groupname"); });

    add_active_for_page();

    $("#navbar-pending-btn").on("click", function(event){ check_pending_questions(); });
    $("#navbar-group-btn").on("click", function(event){ update_dropdown_list(event, "all", "group"); });
});

function check_pending_questions(){
    $.ajax({
        type: "GET",
        url: location.origin + "/getGroup?mode=pending",
        cache: false,
        contentType: "application/json",
        dataType: 'json',
        error: function(e){
            show_msgModal("系統錯誤", "無法取得下拉選單");
            console.log(e);
        },
        success: function(data){
            console.log(data);

            if(data.group_list.length > 0){
                location.replace(location.origin + '/' + role + '/pending');
            }
            else{
                show_msgModal('系統訊息', '檔案皆以審核完畢');
            }
        }
    });
}

function update_dropdown_list(event, query_group_mode, functionpage){
    console.log($(event.target).attr("aria-expanded") == "false");
    if($(event.target).attr("aria-expanded") == "false"){
        $.ajax({
            type: "GET",
            url: location.origin + "/getGroup?mode=" + query_group_mode,
            cache: false,
            contentType: "application/json",
            dataType: 'json',
            error: function(e){
                show_msgModal("系統錯誤", "無法取得下拉選單");
                console.log(e);
            },
            success: function(data){
                console.log(data);

                render_updated_dropdown_list(functionpage, data.group_list);
                add_active_for_page();
            }
        });
    }
}

function set_navbar_tab_active_handler(){
    $(this).addClass('active').siblings().removeClass('active');
}

function render_updated_dropdown_list(functionpage, group_list){
    let dropdown_list_str = '';

    if(functionpage == "group"){
        dropdown_list_str += '<a id="dropdown-show-groupModal-btn" href="#" class="dropdown-item">新增</a>';
    }

    if(group_list.length == 0){
        $("#dropdown-menu-" + functionpage).html('');
    }
    else{
        group_list.forEach((group) => {
            dropdown_list_str += '<a class="dropdown-item" href="/' + role + '/' + functionpage + '/' + group.id + '">' + group.name + '</a>';
        });
        $("#dropdown-menu-" + functionpage).html(dropdown_list_str);
    }
}

function add_active_for_dropdown($this){
    $this.find("div a").each(function(group_idx){
        if($.trim($(this).attr("href")).split("/")[3] == group_item.id.toString()){
            $(this).addClass("active");
            return false;
        }
    });
}

function add_active_for_page(){
    let functionpage = location.pathname.split("/")[2];
    console.log(functionpage);
    $("nav li").each(function(idx){
        if(functionpage == "upload" && idx == 0){
            $(this).addClass("active");
        }
        else if(functionpage == "pending" && idx == 1){
            $(this).addClass("active");
        }
        else if(functionpage == "approved" && idx == 2){
            $(this).addClass("active");
        }
        else if(functionpage == "group" && idx == 3){
            $(this).addClass("active");
            add_active_for_dropdown($(this));
        }
        else if(functionpage == "display" && idx == 4){
            $(this).addClass("active");
        }
    });
}
