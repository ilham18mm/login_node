const LocalStrategy = require("passport-local").Strategy;
const mysql = require("mysql");
const bcrypt = require("bcrypt-nodejs");
const dbconfig = require("./database");
const connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);
connection.on('error', function (err) {
  console.log("apa masalah mu --->", err);
});


module.exports = function(passport){

  passport.serializeUser(function(user, done){
    done(null, user.id);
  });


  passport.deserializeUser(function(id, done){
    connection.query("select * from users where id = ? ", [id], 
      function(err,res){
        done(err, res[0])
      });
  });

  passport.use(
    'local-signup',
    new LocalStrategy({
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true
    },
    function(req, username, password, done){
      connection.query("select * from users where username = ? ", 
      [username], function(err, rows){
        if(err)
          return done(err);
        if(rows.length){
          return done(null, false, req.flash('signupMessage', 'That is already token'));
        }
        else{
          let newUserMysql = {
            username : username,
            password : bcrypt.hashSync(password, null, null)
          };

          let insertQuery = "insert into users (username, password) values (?, ?)";

          connection.query(insertQuery, [newUserMysql.username, newUserMysql.password],
            function(){
              newUserMysql.id = rows.insertId;

              return done(null, newUserMysql);

            });
        }
      });
    })
  );


  passport.use(
    'local-login',
    new LocalStrategy({
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true
    },
    function(req, username, password, done){
      connection.query("select * from users where username = ? ", [username], 
        function(err, rows){
          if(err)
            return done(err);
          if(!rows.length){
            return done(null, false, req.flash('loginMessage', 'No User found'));
          }
          if(!bcrypt.compareSync(password, rows[0].password))
            return done(null, false, req.flash('loginMessage', 'Wrong Password'));

            return done(null, rows[0]);
        });
    })
  );
};