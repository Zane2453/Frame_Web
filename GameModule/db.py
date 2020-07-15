from sqlalchemy import (Boolean, Column, DateTime, Float, ForeignKey,
                        Integer, String, Text, UniqueConstraint)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

base = declarative_base()

######################################
class Question(base):
    __tablename__ = 'Questions'
    id = Column(String(255), primary_key=True)
    name = Column(String(255))
    description = Column(String(255))
    status = Column(Integer)

class Picture(base):
    __tablename__ = 'Pictures'
    id = Column(String(255), primary_key=True)
    order = Column(Integer)
    origin_name = Column(String(255))
    questionId = Column(String(255), ForeignKey('Questions.id'))

class Group(base):
    __tablename__ = 'Groups'
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    status = Column(Integer)

class GroupMember(base):
    __tablename__ = 'GroupMembers'
    id = Column(Integer, primary_key=True)
    questionId = Column(String(255), ForeignKey('Questions.id'))
    groupId = Column(Integer, ForeignKey('Groups.id'))

######################################
engine = None

def connect():
    global engine
    if engine:
        return
    engine = create_engine('sqlite:///../ManagementModule/server/portraitguess.sqlite')
    base.metadata.create_all(engine)

def get_session():
    if not engine:
        connect()
    return Session(engine)
