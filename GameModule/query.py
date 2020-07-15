import db
import json

db.connect()
session = db.get_session()

def get_group_list():
    query = (session
            .query(db.Group.id,
                   db.Group.name)
            .select_from(db.Group)
            .filter(db.Group.status == 1)
            .all())

    group_dict = {}
    group_list = []
    for groupId, group_name in query:
        if(groupId not in group_dict):
            group_dict[groupId] = "yes"
            group_list.append({
                "id": groupId,
                "name": group_name
            })

    groupList = {
        "group": group_list
    }

    print("[DB] get groupList success")
    return groupList

def get_member_list(group_id):
    if(group_id == "all"):
        query = (session
                .query(db.Question.id,
                       db.Question.name,
                       db.Question.description)
                .select_from(db.Question)
                .filter(db.Question.status == 1)
                .all())
    else:
        query = (session
                .query(db.Question.id,
                       db.Question.name,
                       db.Question.description)
                .select_from(db.GroupMember)
                .join(db.Question)
                .filter(db.GroupMember.groupId == group_id)
                .all())

    member_list = []
    for questionId, question_name, question_description in query:
        member_list.append({
            "id": questionId,
            "name": question_name,
            "description": question_description
            })

    print("[DB] get %s's memberList success" % (group_id))
    return member_list

def get_answer_pic(questio_id):
    picture_data = ""

    query = (session
            .query(db.Picture.id,
                   db.Picture.order)
            .select_from(db.Picture)
            .filter(db.Picture.questionId == questio_id)
            .order_by(db.Picture.order)
            .all())

    for pic_id, pic_order in query:
        picture_data = picture_data + "," + pic_id
    picture_data = "p" + picture_data + ";"

    print("[DB] get %s picture data success" % questio_id)
    return picture_data


# print(get_group_list())
# print(get_member_list(1))
# print((get_answer_pic("c307adce-1c0a-4d")))
