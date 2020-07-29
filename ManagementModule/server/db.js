var Sequelize = require('sequelize'),
    sequelize = new Sequelize('questionaire', null, null, {
        define: {
            charset: 'utf8',
            dialectOptions: {
                collate: 'utf8_general_ci'
            }
        },
        logging: false,
        host: 'localhost',
        dialect: 'sqlite',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        // SQLite only
        storage: './portraitguess.sqlite',
        // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
        operatorsAliases: false
    });

const Question = sequelize.define('Question', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.INTEGER
    }
});

const Picture = sequelize.define('Picture', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    order: {
        type: Sequelize.INTEGER
    },
    origin_name: {
        type: Sequelize.STRING
    }
});

const Group = sequelize.define('Group', {
    name: {
        type: Sequelize.STRING
        // unique: true
    },
    status: {
        type: Sequelize.INTEGER
    }
});

const GroupMember = sequelize.define('GroupMember', {
    
});

const Timer = sequelize.define('Timer', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    mode: {
        type: Sequelize.STRING
    },
    stage: {
        type: Sequelize.STRING
    },
    value: {
        type: Sequelize.INTEGER
    }
})

// Group.id <-> GroupMember.GroupId
Group.hasMany(GroupMember, {onDelete: 'cascade', hooks:true});
GroupMember.belongsTo(Group);

// Question.id <-> Picture.QuestionId
Question.hasMany(Picture, {onDelete: 'cascade', hooks:true});
Picture.belongsTo(Question);

// Question.id <-> GroupMember.QuestionId
Question.hasMany(GroupMember, {onDelete: 'cascade', hooks:true});
GroupMember.belongsTo(Question);

var db = {
    orm: sequelize,
    Question: Question,
    GroupMember: GroupMember,
    Group: Group,
    Picture: Picture,
    Timer: Timer
};

exports.db = db;
