var fs = require('fs'),
    db = require('./db').db,
    utils = require("./utils");

function check_db(){
    //db has already existed
    if(fs.existsSync("./portraitguess.sqlite")){
        db.Picture.sync({force: false}).then(function(){});
        db.GroupMember.sync({force: false}).then(function(){});
        db.Question.sync({force: false}).then(function(){});
        db.Group.sync({force: false}).then(function(){});

        add_db_value();
    }
}

function add_db_value(){
    let add_portrait_folder_path = './YB_img/',
        add_group = [],
        add_human_question = [
            { group: [], dirname: "w2"},
            { group: [], dirname: "w3"},
            { group: [], dirname: "w4"},
            { group: [], dirname: "w5"},
            { group: [], dirname: "w6"},
            { group: [], dirname: "w7"},
            { group: [], dirname: "naked-8a"},
            { group: [], dirname: "naked-9a"},
            { group: [], dirname: "naked-10a"},
            { group: [], dirname: "naked-11Eris"},
            { group: [], dirname: "naked-13a"},
            { group: [], dirname: "naked-14a"},
            { group: [], dirname: "naked-16"},
            { group: [], dirname: "naked-18a"},
            { group: [], dirname: "naked-19Wyrd"},
            { group: [], dirname: "naked-20a"},
            { group: [], dirname: "naked-21a"},
            { group: [], dirname: "naked-23a"},
            { group: [], dirname: "naked-24a"},
            { group: [], dirname: "naked-26"},
            { group: [], dirname: "naked-27"},
            { group: [], dirname: "naked-28"},
            { group: [], dirname: "naked-30"},
            { group: [], dirname: "naked-35Verdandi"},
            { group: [], dirname: "naked-36"},
            { group: [], dirname: "naked-37"},
            { group: [], dirname: "naked-38"},
            { group: [], dirname: "naked-40"},
            { group: [], dirname: "naked-41"},
            { group: [], dirname: "naked-43"},
            { group: [], dirname: "naked-45"},
            { group: [], dirname: "naked-46"},
            { group: [], dirname: "Michelle Chang"},
            { group: [], dirname: "腰"},
        ];

    let count = 0;
    add_human_question.forEach((human_question) => {
        let groups = [], pictures = [],
            dirname = add_portrait_folder_path + human_question.dirname,
            name = human_question.dirname,
            description = "";

        for(let i in human_question.group){
            groups.push({ GroupId: human_question.group[i]});
        }
        
        fs.readdirSync(dirname).forEach(pic_file => {
            let pic_name = utils.uuid().substring(0,16) + ".jpg",
                oldpath = dirname + "/" + pic_file,
                newpath = "../web/img/" + pic_name;

            fs.copyFile(oldpath, newpath, (err) => {
                if (err) console.log(err);
            });

            pictures.push({
                id: pic_name,
                order: pic_file.split(".")[0],
                origin_name: pic_file
            });
        });
        
        db.Question.create({
            name: name,
            description: description,
            status : 1,
            GroupMembers : groups,
            Pictures : pictures
        }, {include: [db.GroupMember, db.Picture]}).then(function(){
            console.log(name, " created");
            count += 1;
            if(count == add_human_question.length){
                console.log("--- add [human_question] value done ---");
            }
        });
    });
}

//main
check_db();
