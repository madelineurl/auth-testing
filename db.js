const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const config = {
  logging: false
};

if (process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/jwt-tokens', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.byToken = async(token)=> {
  try {
    const { id } = await jwt.verify(token, process.env.JWT);
    const user = await User.findByPk(id);
    if (user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username
    }
  });

  if (user && await bcrypt.compare(password, user.password)){
    return jwt.sign({ id: user.id }, process.env.JWT );
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.addHook('beforeSave', async function(user) {
  user.password = await bcrypt.hash(user.password, 5);
});

const Note = conn.define('note', {
  text: STRING
});

Note.belongsTo(User);
User.hasMany(Note);

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );

  const notesToAdd = [
    'wash the car', 'check in with dan about Study saturday', 'finish job apps'
  ];

  const notes = await Promise.all(notesToAdd.map(note => Note.create(note)));

 await lucy.addNote(notes[0]);
 await lucy.addNote(notes[1]);
 await moe.addNote(notes[2]);

  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};
