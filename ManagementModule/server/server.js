var express = require("express"),
    app = express(),    // build up a Express server
    http = require("http").createServer(app),
    fs = require('fs'),
    ejs = require('ejs'),
    bodyParser = require('body-parser'),
    path = require('path'),
    formidable = require('formidable'),
    readChunk = require('read-chunk'),
    fileType = require('file-type'),
    config = require('./config'),
    utils = require("./utils"),
    db = require('./db').db,
    cors = require('cors');

/*** upload ***/
let uploadFolder = './upload_cache/';
utils.createFolder(uploadFolder);
/******/

// modified 2019/12/03
// Expired timer
var expired_time = 50;

// modified 2020/0307
// cors for portraitImages
const corsOptions = {
    origin: [
        config.ProcessingWebServer + ':5000',
        config.ProcessingWebServer + ':3000',
    ],
    methods: 'GET',
    allowedHeaders: ['Content-Type', 'image/jpeg'],
};
app.use(cors(corsOptions));

//static files
app.use(express.static("../web"));

app.use(bodyParser.urlencoded({
    extended: true,
}));

// process http body
app.use(bodyParser.json());

// decompose html (let html can include html)
app.set("view engine", "html");
app.set("views", path.join(__dirname, "../web/html"));
app.engine("html", ejs.renderFile);

// server start
console.log('---server start---');
http.listen((process.env.PORT || config.MngtServerPort), '0.0.0.0');

/* APIs */
// modified 2019/12/03
// get expired time
app.get("/getExpiredTime", function (req, res) {
    //response
    utils.sendResponse(res, 200, JSON.stringify(expired_time));
});

// set expired time
app.post("/setExpiredTime", function (req, res) {
    expired_time = req.body.expired_time;
    //response
    utils.sendResponse(res, 200, JSON.stringify(expired_time));
});

// get getQuestion API
app.get("/getQuestion", function (req, res) {
    console.log("---getQuestion---");

    let question_id = req.query.question_id,
        img_size = 0.0,
        total_img_size = 0.0,
        questionData = {};

    console.log("get question:", question_id, "all data");
    //find all Group for check which this question has checked
    db.Group.findAll({ order: [['id', 'ASC']] }).then(GroupList => {
        let checkedGroup_list = [];
        GroupList.forEach((GroupSetItem) => {
            let GroupData = GroupSetItem.get({ plain: true });
            //create checked group list
            checkedGroup_list.push({
                id: GroupData.id,
                name: GroupData.name,
                used: 0
            });
        });

        //find question by id
        db.Question.findOne({
            where: { id: question_id },
            include: [{ model: db.Picture },
            { model: db.GroupMember }]
        }).then(QuestionObject => {
            let QuestionData = QuestionObject.get({ plain: true });

            //sort picture by order
            let picId, sortedPic_list = [];
            for (let i = 0; i < QuestionData.Pictures.length; i++) {
                picId = utils.getPicIdbyOrder(QuestionData.Pictures, i + 1);
                if (picId != "none") {
                    img_size = Math.round((utils.getFilesizeInBytes("../web/img/" + picId) / 1000000.0) * 100) / 100;
                    total_img_size += img_size;
                    sortedPic_list.push({
                        src: picId,
                        size: img_size
                    });
                    // console.log(utils.getFilesizeInBytes("../web/img/" + picId) / 1000000.0);
                }
            }

            //mark those group for this question
            for (let i = 0; i < checkedGroup_list.length; i++) {
                for (let j = 0; j < QuestionData.GroupMembers.length; j++) {
                    if (checkedGroup_list[i].id == QuestionData.GroupMembers[j].GroupId) {
                        checkedGroup_list[i].used = 1;
                    }
                }
            }

            //set question data
            questionData["name"] = QuestionData.name;
            questionData["description"] = QuestionData.description;
            questionData["picture"] = sortedPic_list;
            questionData["group"] = checkedGroup_list;
            questionData["total_img_size"] = Math.round(total_img_size * 100) / 100;;
            console.log(questionData);

            //response
            utils.sendResponse(res, 200, JSON.stringify(questionData));
        });
    });
});

// post uploadQuestion API
app.post('/uploadQuestion', function (req, res) {
    console.log("---uploadQuestion---");
    let user_upload_data = {}, img_order = {},
        qname = "", description = "", save_path = "",
        pictures = [], groupmembers = [], selected_group = [], photo_path = [],
        photo_status = true,
        form = new formidable.IncomingForm();

    form.multiples = true;
    form.uploadDir = path.join(__dirname, 'upload_cache');

    form.on('field', function (name, field) {
        if (name == "user_upload_data") {
            user_upload_data = JSON.parse(field);
            qname = user_upload_data["name"];
            description = user_upload_data["description"];
            img_order = user_upload_data["img_order"];
            selected_group = user_upload_data["selected_group"];

            console.log(user_upload_data);
        }
    });

    form.on('file', function (name, file) {
        let buffer = null, type = null, order = 0,
            picture_id = utils.uuid().substring(0, 16);

        buffer = readChunk.sync(file.path, 0, 262);
        type = fileType(buffer);
        photo_path.push(file.path);

        // Check the file type, must be either png, jpg or jpeg
        if (type !== null && (type.ext === 'png' || type.ext === 'jpg' || type.ext === 'jpeg')) {
            save_path = "../web/img/" + picture_id + "." + type.ext;
            fs.rename(file.path, save_path, function (err, result) {
                if (err) console.log('error', err);
            });

            //find corresponding index from img_order
            if (img_order.hasOwnProperty(file.name)) {
                order = img_order[file.name];
            }

            //add to pictures list for db create
            pictures.push({
                id: picture_id + "." + type.ext,
                order: order,
                origin_name: file.name
            });

            console.log(file.name, picture_id, order);
        }
        else {
            console.log(file.name, " suck");

            //dirty file
            photo_status = false;
        }
    });

    form.on('error', function (err) {
        console.log('Error occurred during processing - ' + err);
    });

    form.on('end', function () {
        console.log('All the request fields have been processed.');
    });

    // Parse the incoming form fields.
    form.parse(req, function (err, fields, files) {
        if (photo_status) {
            //create this question to related db
            console.log("start create this question...");
            for (let i = 0; i < selected_group.length; i++) {
                groupmembers.push({
                    GroupId: selected_group[i].group_id
                });
            }

            let data = {
                name: qname,
                description: description,
                status: 0,
                Pictures: pictures,
                GroupMembers: groupmembers
            };
            db.Question.create(data, { include: [db.Picture, db.GroupMember] }).then(function (q) {
                console.log(q.id + " " + q.name + " created!!");
                //send success response
                utils.sendResponse(res, 200, JSON.stringify({ photo_status: 1 }));
            });
        }
        else {
            console.log("this question upload fail");
            //delete all files
            for (let path in photo_path) {
                fs.unlink(path, (err) => {
                    if (err) {
                        console.log(path, " cannot be delete Q");
                    }
                });
            }
            //send failed response
            utils.sendResponse(res, 200, JSON.stringify({ photo_status: 0 }));
        }
    });
});

// put updateQuestion API
app.put('/updateQuestion', function (req, res) {
    let mode = req.body.mode,
        user_update_data = req.body.user_update_data,
        question_id = user_update_data.id,
        new_name = user_update_data.name,
        new_description = user_update_data.description,
        new_img_order = user_update_data.img_order,
        new_selected_group = user_update_data.selected_group;

    console.log("---updateQuestion---");
    console.log(mode, user_update_data);
    if (mode == "simple") {
        db.Question.update( //update question status
            { status: 1 },
            { where: { id: question_id } }
        ).then(function () {
            //send response
            utils.sendResponse(res, 200, "success!");
        });
    }
    else { //update this question for related db
        db.Question.update( //update question status
            {
                status: 1,
                name: new_name,
                description: new_description
            },
            { where: { id: question_id } }
        ).then(function () {
            //update question group
            db.GroupMember.destroy({ //destroy old question group
                where: { QuestionId: question_id }, force: true
            }).then(function () { //create new question group
                let new_selected_group_list = [];
                new_selected_group.forEach((groupId) => {
                    new_selected_group_list.push({
                        GroupId: groupId, QuestionId: question_id
                    });
                });

                db.GroupMember.bulkCreate(new_selected_group_list).then(function () {
                    //update picture order
                    db.Picture.destroy({ //destroy old picture
                        where: { QuestionId: question_id }, force: true
                    }).then(function () { //create new picture
                        let new_picture_list = [];
                        for (let key in new_img_order) {
                            if (new_img_order.hasOwnProperty(key)) {
                                new_picture_list.push({
                                    id: key,
                                    order: new_img_order[key],
                                    origin_name: "",
                                    QuestionId: question_id
                                });
                            }
                        }
                        // console.log(new_picture_list);
                        db.Picture.bulkCreate(new_picture_list).then(function () {
                            console.log("pic update done");
                            //send response
                            utils.sendResponse(res, 200, "success!");
                        });
                    });
                });
            });
        });
    }
});

// get QuestionStatus API
app.get("/checkQuestionDeletable", function (req, res) {
    let question_id = req.query.question_id;
    console.log(question_id);

    console.log("---checkQuestionAvailable---");
    db.Question.findOne({ where: { id: question_id } }).then(function (c) {
        if (c != null) {
            if (c.status == 1) {
                db.Group.findAll({
                    where: { status: 1 },
                    include: [{
                        model: db.GroupMember,
                        where: { QuestionId: question_id },
                        reqired: true
                    }]
                }).then(GroupList => {
                    if (GroupList.length > 0) { //using
                        console.log(question_id, "is using !!");
                        utils.sendResponse(res, 200, JSON.stringify({ using: 1 }));
                    }
                    else { //safe to be deleted
                        console.log(question_id, "is safe to be deleted");
                        utils.sendResponse(res, 200, JSON.stringify({ using: 0 }));
                    }
                });
            }
            else { //safe to be deleted
                console.log(question_id, " is safe to be deleted");
                utils.sendResponse(res, 200, JSON.stringify({ using: 0 }));
            }
        }
    })
});

// delete deleteQuestion API
app.delete('/deleteQuestion', function (req, res) {
    let delete_question_id = req.body.delete_question_id;

    /* delete this question from all related tables */
    console.log("---deleteQuestion---");
    //unlink related picture files from server
    db.Picture.findAll({ where: { QuestionId: delete_question_id } }).then(PictureList => {
        PictureList.forEach((PictureSetItem) => {
            let PictureData = PictureSetItem.get({ plain: true });
            let path = '../web/img/' + PictureData.id;

            fs.unlink(path, (err) => {
                if (err) console.log(PictureData.id, ' cannot be deleted');
                else console.log(PictureData.id, ' deleted');
            });
        });

        //delete all picture files from server storage
        console.log("all pictures have been successfully deleted from server storage");
        db.Question.destroy({ where: { id: delete_question_id } }).then(function () {
            console.log("delete ", delete_question_id, " success");

            //send response
            utils.sendResponse(res, 200, "success");
        });
    });
});

// get getGroup API
app.get('/getGroup', function (req, res) {
    let mode = req.query.mode;

    console.log("---getGroup---");
    console.log("mode:", mode);
    if (mode == "all") {
        let group_id = req.query.group_id,
            group_list = [];

        console.log("get all groups");
        db.Group.findAll({
            order: [['id', 'ASC']],
        }).then(GroupList => {
            GroupList.forEach((GroupSetItem) => {
                let GroupData = GroupSetItem.get({ plain: true });
                group_list.push({
                    id: GroupData.id,
                    name: GroupData.name,
                    status: GroupData.status
                });
            });
            console.log(group_list);

            //response
            utils.sendResponse(res, 200, JSON.stringify({
                group_list: group_list
            }));
        });
    }
    else if (mode == "approved") {
        let group_list = [];

        console.log("get approved groups");
        db.Group.findAll({
            order: [['id', 'ASC']],
            include: [{
                model: db.GroupMember,
                include: [{
                    model: db.Question,
                    where: { status: 1 },
                    required: true
                }],
                required: true
            }]
        }).then(GroupList => {
            GroupList.forEach((GroupSetItem) => {
                let GroupData = GroupSetItem.get({ plain: true });
                group_list.push({
                    id: GroupData.id,
                    name: GroupData.name,
                    status: GroupData.status
                });
            });
            console.log(group_list);

            utils.sendResponse(res, 200, JSON.stringify({
                group_list: group_list
            }));
        });
    }
    else if (mode == "pending") {
        let group_list = [];

        db.Question.findAll({
            where: { status: 0 }
        }).then(QuestionList => {
            if (QuestionList.length > 0) {
                group_list.push({
                    id: "all",
                    name: "不分類",
                    status: 0
                });
            }

            //send response
            utils.sendResponse(res, 200, JSON.stringify({
                group_list: group_list
            }));
        });
    }
});

// post addGroup API
app.post('/addGroup', function (req, res) {
    let group_name = req.body.newgroup_name,
        group_member = req.body.newgroup_member;

    console.log("---addNewGroup---");
    console.log("add new group name:", group_name);
    console.log("add new group member:", group_member);

    let data = {
        name: group_name,
        status: 0,
        GroupMembers: group_member
    };

    db.Group.create(data, { include: [db.GroupMember] }).then(function () {
        db.Group.findOne({ where: { name: group_name } }).then(function (g) {
            if (g != null) {
                console.log("new group added success with group_id:", g.id);

                // response
                utils.sendResponse(res, 200, JSON.stringify({
                    id: g.id,
                    name: g.name
                }));
            }
        });
    });
});

// delete deleteGroup API
app.delete('/deleteGroup', function (req, res) {
    let delete_group_id = req.body.delete_group_id;
    console.log("---deleteGroup---");

    db.Group.destroy({ where: { id: delete_group_id } }).then(function () {
        console.log("group_id:", delete_group_id, "successfully deleted");

        //send response
        utils.sendResponse(res, 200, "success!");
    });
});

// put updateGroup API
app.put('/updateGroup', function (req, res) {
    let mode = req.body.mode,
        update_group_id = req.body.update_group_id,
        update_group_name = req.body.update_group_name,
        group_list = req.body.group_list,
        index;

    console.log("---updateGroup---");
    console.log("group:", update_group_id, "in mode:", mode, " is updating...");
    if (mode == "add_member") {
        let new_groupmember_list = [];

        group_list.forEach((element) => {
            new_groupmember_list.push({
                GroupId: update_group_id,
                QuestionId: element.question_id,
            });
        });

        //create new member
        db.GroupMember.bulkCreate(new_groupmember_list).then(function () {
            //send response
            utils.sendResponse(res, 200, "success");
        });
    }
    else if (mode == "delete_member") {
        let count = 0;

        group_list.forEach((element) => {
            db.GroupMember.destroy({
                where: {
                    GroupId: update_group_id,
                    QuestionId: element.question_id
                },
                force: true
            }).then(function () {
                console.log("delete ", element.question_id, "from group_id", update_group_id, "success");
                count += 1;
                if (count == group_list.length) {
                    //send response
                    utils.sendResponse(res, 200, "success");
                }
            });
        });
    }
    else if (mode == "new_name") {
        //do something
        db.Group.update(
            { name: update_group_name },
            { where: { id: update_group_id } }
        ).then(function () {
            console.log("update new_name", update_group_name);
            //send response
            utils.sendResponse(res, 200, "success");
        });
    }
    else if (mode == "update_member") {
        let new_groupmember_list = [];

        group_list.forEach((element) => {
            new_groupmember_list.push({
                GroupId: update_group_id,
                QuestionId: element.question_id,
            });
        });

        //destroy old member
        db.GroupMember.destroy({
            where: { GroupId: update_group_id }, force: true
        }).then(function () {
            //create new member
            db.GroupMember.bulkCreate(new_groupmember_list).then(function () {
                //send response
                utils.sendResponse(res, 200, "success");
            });
        });
    }
});

//put setDisplayGroup API
app.put('/setDisplayGroup', function (req, res) {
    let selected_group_list = req.body.selected_group_list,
        playlist = [];

    console.log("---setDisplayGroup---");
    console.log("display group:", selected_group_list);
    db.Group.update( //let all group set to unuse
        { status: 0 },
        { where: { status: 1 } }
    ).then(function () {
        if (selected_group_list.length == 0) {
            //send response
            utils.sendResponse(res, 200, "success");
        }
        else {
            let count = 0;
            selected_group_list.forEach((selected_group) => { //set selected group to use
                db.Group.update(
                    { status: 1 },
                    { where: { id: selected_group.id } }
                ).then(function () {
                    count += 1;
                    if (count == selected_group_list.length) {
                        //send response
                        utils.sendResponse(res, 200, "success");
                    }
                });
            });
        }
    });
});

// get getGroupMember API
app.get("/getGroupMember", function (req, res) {
    let group_id = req.query.group_id,
        status = req.query.status;

    console.log("---getGroupMember---");
    console.log("info:", req.query.info);
    if (group_id == "all") {
        if (req.query.info == "detail") {
            db.Question.findAll({
                where: { status: status },
                order: [['createdAt', 'ASC']],
                include: [{
                    model: db.GroupMember,
                    include: [{
                        model: db.Group,
                        required: true
                    }]
                }]
            }).then(GroupMemberList => {
                let question_list = [],
                    group_id_list = [],
                    group_name_list = [];
                GroupMemberList.forEach((GroupMember) => {
                    let GroupMemberData = GroupMember.get({ plain: true });
                    group_id_list = [], group_name_list = [];
                    GroupMemberData.GroupMembers.forEach((GroupMemberSetItem) => {
                        group_id_list.push(GroupMemberSetItem.GroupId);
                        group_name_list.push(GroupMemberSetItem.Group.name);
                    });

                    question_list.push({
                        id: GroupMemberData.id,
                        name: GroupMemberData.name,
                        description: GroupMemberData.description,
                        update_time: GroupMemberData.updatedAt,
                        group_id_list: group_id_list,
                        group_name_list: group_name_list
                    });
                });
                console.log(question_list);

                //response
                utils.sendResponse(res, 200, JSON.stringify({
                    question_list: question_list
                }));
            });
        }
        else {
            db.Question.findAll({
                where: { status: status },
                order: [['createdAt', 'ASC']]
            }).then(GroupMemberList => {
                let question_list = [];
                GroupMemberList.forEach((GroupMember) => {
                    let GroupMemberData = GroupMember.get({ plain: true });
                    question_list.push({
                        id: GroupMemberData.id,
                        name: GroupMemberData.name,
                        description: GroupMemberData.description,
                    });
                });
                console.log(question_list);

                // response
                utils.sendResponse(res, 200, JSON.stringify({
                    question_list: question_list
                }));
            });
        }
    }
    else {
        db.GroupMember.findAll({
            where: { GroupId: group_id },
            include: [{
                model: db.Question,
                where: { status: status },
                order: [['createdAt', 'ASC']],
                required: true
            }],
            required: true
        }).then(GroupMemberList => {
            let question_list = [];

            if (GroupMemberList.length == 0) {
                console.log(question_list);
                utils.sendResponse(res, 200, JSON.stringify({
                    question_list: question_list
                }));
            }
            else {
                let count = 0;

                GroupMemberList.forEach((GroupMember) => {
                    let GroupMemberData = GroupMember.get({ plain: true });

                    //for group
                    if (req.query.info == "detail") {
                        let group_id_list = [],
                            group_name_list = [];

                        db.GroupMember.findAll({
                            where: { QuestionId: GroupMemberData.Question.id },
                            include: [{
                                model: db.Group,
                                required: true
                            }]
                        }).then(GroupList => {
                            group_id_list = [],
                                group_name_list = [];

                            GroupList.forEach((GroupSetItem) => {
                                let GroupData = GroupSetItem.get({ plain: true });
                                group_id_list.push(GroupData.GroupId);
                                group_name_list.push(GroupData.Group.name);
                            });

                            question_list.push({
                                id: GroupMemberData.Question.id,
                                name: GroupMemberData.Question.name,
                                description: GroupMemberData.Question.description,
                                group_id_list: group_id_list,
                                group_name_list: group_name_list
                            });

                            count += 1;
                            if (count == GroupMemberList.length) {
                                console.log(question_list);
                                utils.sendResponse(res, 200, JSON.stringify({
                                    question_list: question_list
                                }));
                            }
                        });
                    }
                    else {
                        question_list.push({
                            id: GroupMemberData.Question.id,
                            name: GroupMemberData.Question.name,
                            description: GroupMemberData.Question.description,
                        });
                    }
                });

                if (req.query.info != "detail") {
                    // response
                    console.log(question_list);
                    utils.sendResponse(res, 200, JSON.stringify({
                        question_list: question_list
                    }));
                }
            }
        });
    }
});

function send_page_response(res, pagename, isadmin = false, group_item = {}) {
    let group_list = [],
        pending_group_list = [],
        approved_group_list = [];

    //get all group
    db.Group.findAll({
        order: [['id', 'ASC']]
    }).then(GroupList => {
        GroupList.forEach((GroupSetItem) => {
            let GroupData = GroupSetItem.get({ plain: true });
            group_list.push({
                id: GroupData.id,
                name: GroupData.name,
                status: GroupData.status
            });
        });

        //get pending group
        db.Question.findAll({
            order: [['id', 'ASC']],
            where: { status: 0 }
        }).then(pendingGroupList => {
            pendingGroupList.forEach((pendingGroupSetItem) => {
                let pendingGroupData = pendingGroupSetItem.get({ plain: true });
                pending_group_list.push({
                    id: pendingGroupData.id,
                    name: pendingGroupData.name
                });
            });

            //get approved group
            db.Group.findAll({
                order: [['id', 'ASC']],
                include: [{
                    model: db.GroupMember,
                    include: [{
                        model: db.Question,
                        where: { status: 1 },
                        required: true
                    }],
                    required: true
                }]
            }).then(approvedGroupList => {
                approvedGroupList.forEach((approvedGroupSetItem) => {
                    let approvedGroupData = approvedGroupSetItem.get({ plain: true });
                    approved_group_list.push({
                        id: approvedGroupData.id,
                        name: approvedGroupData.name,
                        status: approvedGroupData.status
                    });
                });

                let data = {
                    group_list: group_list,
                    pending_group_list: pending_group_list,
                    approved_group_list: approved_group_list,
                    group_item: group_item,
                    isadmin: isadmin
                };
                // console.log(data);

                //send response
                res.status(200);
                res.render(pagename, data);
            });
        });
    });
}

/* web page */
// manage pages
app.get("/manage", utils.auth, function (req, res) {
    send_page_response(res, "manage.html", true);
});

app.get("/manage/:functionpage", utils.auth, function (req, res) {
    let functionpage = req.params.functionpage;

    if (!(functionpage == "upload" || functionpage == "pending" ||
        functionpage == "approved" || functionpage == "display")) {
        res.status(404).send("page not found");
    }
    else {
        send_page_response(res, functionpage + ".html", true);
    }
});

app.get("/manage/group/:group_id", utils.auth, function (req, res) {
    let group_id = req.params.group_id;

    if (group_id == "all") {
        send_page_response(res, "group.html", true, { id: "all", name: "全部" });
    }
    else {
        db.Group.findOne({ where: { id: group_id } }).then(function (c) {
            if (c != null) {
                send_page_response(res, "group.html", true, { id: c.id, name: c.name, status: c.status });
            }
            else {
                res.status(404).send("page not found");
            }
        });
    }
});

// user page
// app.get("/user", function(req, res){
//     send_page_response(res, "manage.html");
// });
// app.get("/user/upload/:class_id", function(req, res){
//     let class_id = req.params.class_id;
//     check_class_exist_and_then_render_page(class_id, res, "upload.html");
// });
