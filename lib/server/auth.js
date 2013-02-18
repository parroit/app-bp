var sys = require('sys');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
exports.name = "auth";

var app;
exports.init=function($app){app=$app};

exports.routes = {
    get:{
        '/checkUserLogged':'auth.checkUserLogged@json',
        '/users':'auth.list@json',
        '/user/:username':'auth.user@json'
    },
    post:{
        '/conferma/:id':'auth.conferma@json',
        '/user/delete/:username':'auth.deleteUser@json',
        '/logout':'auth.logout@json',
        '/register-user':'auth.saveRegister@json',
        '/reset-password':'auth.resetPassword@json',
        '/user/:username':'auth.save_user@json',
        '/save-profile':'auth.save_profile@json',
        '/login':'auth.login@json'
    }
};

exports.register = function () {
    this.renderer({
        username:"",
        password:"",
        nome:"",
        cognome:"",
        email:""
    });

};
function guid() {
    var S4 = function () {
        return Math.floor(
            Math.random() * 0x10000 /* 65536 */
        ).toString(16);
    };

    return S4() + S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + S4() + S4();
}
exports.conferma=function(id){
    var self=this;
    this.onCollection('users', function (client,collection){
        collection.update({confirmation:id},{ $set: {confirmation:null}},function(err,result){
            if(result==0){
                self.redirect("/login?message=Id+non+valido+o+gia+confermato")
            } else
                self.redirect("/login?message=Indirizzo+email+confermato")
        });
    });
};
function generatePassword() {
    var length = 8,
        charset = "abcdefghjknpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}
exports.resetPassword=function(id){
    var self=this;
    var email = self.request.body.email;
    this.onCollection('users', function (client,collection){
        collection.findOne({email:email},function(err,result){
            if (result){
                var pwd=generatePassword();
                var mailBody = "Gentile "+result.nome+",\r\nsu tua richiesta abbiamo ricreato la tua password per il tuo account.\r\nLa nuova password che puoi usare è:\r\n\r\n"+pwd
                    +"\r\n\r\nPer eseguire il login con la nuova password vai all'indirizzo http://beta.digital-studio.it/bv#/login\r\n\r\n"+
                    "Questa email è stata generata automaticamente, ti preghiamo quindi di non rispondere all'indirizzo da cui ti è arrivata.\r\nPer ulteriore assistenza puoi contattarci all'indirizzo frencia@digital-studio.it.\r\n\r\nCordiali saluti,\r\nEmanuele Frencia";
                var html = mailBody.replace(/\r\n/g,"<br/>").
                    replace(/http:\/\/beta.digital\-studio\.it\/bv#\/login/,"<a href='http://beta.digital-studio.it/bv#/login'>http://beta.digital-studio.it/bv#/login</a>").
                    replace(/frencia@digital\-studio\.it/,"<a href='mailto://frencia@digital-studio.it'>frencia@digital-studio.it</a>");

                var mailOptions = {
                    from: "Digital Studio <robot@digital-studio.it>", // sender address
                    to: email, // list of receivers
                    subject: "Nuova password per il sito digital-studio.it", // Subject line
                    text: mailBody,
                    html: html
                };


                sendMail(mailOptions, function () {

                        self.renderer({status:"ok"});
                    },function (error) {
                        self.renderer({status:"error",error:error});
                    }
                );


            } else {
                self.renderer({status:"error",error:"L'email specificata non è stata trovata nel sistema."});
            }
        });
    });
};
function sendMail(mailOptions,onSuccess,onError) {
    var nodemailer = require("nodemailer");

    var smtpTransport = nodemailer.createTransport("SMTP", {
        host:app.config.mailer.host,
        auth:{
            user:app.config.mailer.username,
            pass:app.config.mailer.password
        }
    });


    smtpTransport.sendMail(mailOptions, function (error) {
        if (error) {
            onError && onError(error);
        } else {
            onSuccess && onSuccess();
        }

        smtpTransport.close(); // shut down the connection pool, no more messages
    });
}
exports.sendMail=sendMail;
exports.saveRegister=function(){
    var self=this;
    var user = self.request.body;
    this.onCollection('users', function (client,collection){

        var confirmation = guid();
        collection.insert(
            {
                _id:user.username,
                username:user.username,
                password:getPasswordHash(user.username,user.password),
                nome:user.nome,
                cognome:user.cognome,
                ruolo:"usr",
                email:user.email,
                confirmation:confirmation
            },
            function () {
                client.close();
                var mailOptions = {
                    from: "Eban Software <andrea.parodi@ebansoftware.net>", // sender address
                    to: user.email, // list of receivers
                    subject: "Conferma dell'iscrizione al sito eban software", // Subject line
                    text: "Benvenuto,"+user.nome+".\r\nPer confermare il tuo indirizzo ed attivare l'account: http://localhost:8888/conferma/"+confirmation, // plaintext body
                    html: "<p>Benvenuto,<strong>"+user.nome+"</strong></p><p>Per confermare il tuo indirizzo ed attivare l'account: <a href='http://localhost:8888/conferma/"+confirmation+"'>clicca qui</a></p>"
                };


                sendMail(mailOptions, function () {
                        self.redirect("/login?message=Sei+stato+registrato.+Riceverai+una+email+con+un+link+di+conferma+che+dovrai+cliccare.")
                    },function (error) {
                        throw(error);
                    }
                );
            }
        );

    });
};
exports.authenticated= function (callback) {
    function action() {
        if(!this.request.session || this.request.session.user==null) {
            this.unauthorized();
        }else
            callback.apply(this,this.args);

    }
    return action;

};
exports.role= function (roleNames,callback) {
    function action() {
        var user = this.request.session.user;
        if(user!=null && roleNames.indexOf(user.ruolo)>-1) {
            callback.apply(this,this.args);
        }else
            this.redirect("/login");

    }
    return action;

};

exports.list = exports.role('adm',function () {
    var self=this;
    self.onCollection('users', function (err, collection) {

        collection.find().toArray(function (err, results) {

            self.renderer({status:"ok",results:  results});

        });
    });
});


var Validator=require("./validator").Validator;


function save_user_prv(context, username,user,onSuccess) {

    var v = new Validator(user);
    v.check('username').notNull().isAlphanumeric();
    v.check('password').strongPassword().notNull();
    v.check('email').notNull().isEmail();
    v.check('ruolo').notNull().isIn(['adm','cst','usr']);




    
    if (!v.isValid())     {
        onSuccess(v.errors);
        return;
    }

    context.onCollection('users', function (err, collection) {

        collection.findOne({_id:username}, function (err, result) {

            user.password = getPasswordHash(user.username, user.password);
            if (result) {
                for (var key in user) {
                    if (user.hasOwnProperty(key))
                        result[key] = user[key];
                }

                collection.save(result, function () {
                    onSuccess();
                });
            } else {
                user._id=username;
                collection.insert(user, function () {
                    onSuccess();
                });
            }

        });
    });
}
exports.save_user= exports.role('adm',function (username) {
    var self=this;
    save_user_prv(self, username,self.request.body.user,function(error){
        if (error){
            self.renderer({status:"invalid",error:error});
        } else {
            self.renderer({status:"ok"});
        }

    });

});
exports.save_profile= exports.authenticated(function () {
    var self=this;
    save_user_prv(this, this.request.session.user.username,this.request.body.user,function(){
        self.request.session.user= self.request.body.user;
        self.renderer({status:"ok"});
    });
});

exports.deleteUser= exports.role('adm',function (username) {
    var self=this;

    self.onCollection('users', function (err, collection) {

        collection.remove({_id:username},1,function (err,result) {
            if (err)
                throw new Error(err);
            else
                self.renderer({status:"ok",result:result});
        });


    });


});
exports.user = exports.role('adm',function (username) {
    var self=this;

    self.onCollection('users', function (err, collection) {
        collection.findOne({_id:username},function (err, result) {
            self.renderer(result);
        });
    });

});

exports.users = exports.role("adm",function () {

    this.renderer();
});

exports.logout  = exports.authenticated(function () {
    this.request.session.destroy();
    this.renderer({status:"ok"});
});

function getPasswordHash(username,password){
    var crypto = require('crypto');

    var md5 = crypto.createHash('md5');
    md5.update(username);
    md5.update("\0");
    md5.update(password);
    return md5.digest('hex')
}


exports.onAppStart=function(){
    //noinspection JSUnresolvedFunction
    this.onCollection('users', function (client,collection){
        collection.count(function (err, count) {
            if(count==0){
                var admin=app.config.auth.admin;
                admin._id=admin.username;
                admin.password=getPasswordHash(admin.username,admin.password),
                admin.ruolo="adm";
                collection.insert(

                    admin,
                    function (err, docs) {
                        client.close();
                    });
            }
        });
    });

};

var getToken =exports.getToken= function getToken(user) {
    var crypto = require('crypto');

    var md5 = crypto.createHash('md5');
    md5.update(user.username);
    md5.update("\0");
    md5.update(user.password);
    return md5.digest('hex')
};
exports.checkUserLogged=exports.authenticated(function(){
    var self=this;

    self.renderer({
        status:"ok",
        user:self.request.session.user
    });
});
exports.login = function () {
    var self=this;

    var params = this.request.body.params;
    var username=params.username,
        password=params.password;

    self.onCollection('users', function (client,collection){

        collection.find({username:username ,password:getPasswordHash(username,password)}).toArray(function (err, results) {
            client.close();
            if(results.length>0) {
                var user = results[0];
                if(user.confirmation){
                    self.request.session.user=null;

                    self.renderer({
                        status:"error",
                        error:"Devi confermare il tuo indirizzo email cliccando sul link che troverai nella mail di conferma."
                    });
                }
                else{
                    user.token=getToken(user);
                    self.request.session.user=user;
                    if (params.remember){
                        self.request.session.cookie.maxAge=30*24*60*60*1000;
                    }
                    self.request.session.save(function(){
                        self.renderer({
                            status:"ok",
                            user:user
                        });
                    });
                }

            }
            else
            {
                self.request.session.user=null;

                self.renderer({
                    status:"error",
                    error:"Username o password non valide"
                });
            }
        });


    });

};

