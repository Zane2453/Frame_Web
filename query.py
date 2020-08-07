from model import (connect, get_session,
                   Question, Picture, Group, GroupMember, Timer)
import json

connect()
db_session = get_session()

''' Function of Accessing Database '''
def get_group_list():
    query = (db_session
            .query(Group.id,
                   Group.name)
            .select_from(Group)
            .filter(Group.status == 1)
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
        query = (db_session
                .query(Question.id,
                       Question.name,
                       Question.description)
                .select_from(Question)
                .filter(Question.status == 1)
                .all())
    else:
        query = (db_session
                .query(Question.id,
                       Question.name,
                       Question.description)
                .select_from(GroupMember)
                .join(Question)
                .filter(GroupMember.groupId == group_id)
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

    query = (db_session
            .query(Picture.id,
                   Picture.order)
            .select_from(Picture)
            .filter(Picture.questionId == questio_id)
            .order_by(Picture.order)
            .all())

    picture_number = 0
    for pic_id, pic_order in query:
        picture_data = picture_data + "," + pic_id
        picture_number += 1
    picture_data = "p" + picture_data + ";"

    print("[DB] get %s picture data success" % questio_id)
    return picture_data, picture_number

def get_timer(mode, stage):
    query = (db_session
             .query(Timer.value)
             .select_from(Timer)
             .filter(Timer.mode == mode)
             .filter(Timer.stage == stage)
             .first())
    for timer_value in query:
        timer = timer_value

    print(f"[DB] get mode {mode} and stage {stage} timer data success")
    return timer

def get_all_timer():
    query = (db_session
             .query(Timer.mode,
                    Timer.stage,
                    Timer.value)
             .select_from(Timer)
             .all())
    timer = {}
    for timer_mode, timer_stage, timer_value in query:
        if timer_mode in timer:
            timer[timer_mode][timer_stage] = timer_value
        else:
            timer[timer_mode] = {}
            timer[timer_mode][timer_stage] = timer_value

    print(f"[DB] get all timer data success")
    return timer