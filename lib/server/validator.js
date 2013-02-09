function checkPassword(pwdValue,minchar) {
    var common=["password", "sex", "god", "123456", "123", "liverpool", "letmein", "qwerty", "monkey"];
    var score = 0;
    //var E = B.verdects[0];
    if (pwdValue.length < minchar) {
        score = (score - 100)
    } else {
        if (pwdValue.length >= minchar && pwdValue.length <= (minchar + 2)) {
            score = (score + 6)
        } else {
            if (pwdValue.length >= (minchar + 3) && pwdValue.length <= (minchar + 4)) {
                score = (score + 12)
            } else {
                if (pwdValue.length >= (minchar + 5)) {
                    score = (score + 18)
                }
            }
        }
    }
    if (pwdValue.match(/[a-z]/)) {
        score = (score + 1)
    }
    if (pwdValue.match(/[A-Z]/)) {
        score = (score + 5)
    }
    if (pwdValue.match(/\d+/)) {
        score = (score + 5)
    }
    if (pwdValue.match(/(.*[0-9].*[0-9].*[0-9])/)) {
        score = (score + 7)
    }
    if (pwdValue.match(/.[!,@,#,$,%,^,&,*,?,_,~]/)) {
        score = (score + 5)
    }
    if (pwdValue.match(/(.*[!,@,#,$,%,^,&,*,?,_,~].*[!,@,#,$,%,^,&,*,?,_,~])/)) {
        score = (score + 7)
    }
    if (pwdValue.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
        score = (score + 2)
    }
    if (pwdValue.match(/([a-zA-Z])/) && pwdValue.match(/([0-9])/)) {
        score = (score + 3)
    }
    if (pwdValue.match(/([a-zA-Z0-9].*[!,@,#,$,%,^,&,*,?,_,~])|([!,@,#,$,%,^,&,*,?,_,~].*[a-zA-Z0-9])/)) {
        score = (score + 3)
    }
    for (var D = 0; D < common.length; D++) {
        if (pwdValue.toLowerCase() == common[D]) {
            score = -200
        }
    }
    return score
}

function Validator(model){
    var self=this;
    self.model=model;

    var validatore = require('validator');

    var Valda = validatore.Validator;
    Valda.prototype.strongPassword = function() {
        if (checkPassword(this.str,6)<15){
            this.error(this.msg || "Deve avere una difficoltà almeno media ed essere più lunga di 6 caratteri");

        }

        return this; //Allow method chaining
    };



    self.v = new Valda();
    self.checkedField='';
    self.errors={count:0};
    self.v.error = function(msg) {
        self.errors[self.checkedField]=msg;
        self.errors.count++;
    }
}
Validator.prototype.check =function(fieldName){
    this.checkedField=fieldName;
    return this.v.check(this.model[fieldName]);
};
Validator.prototype.isValid =function(){
    return this.errors.count==0;
};
Validator.prototype.addError=function(fieldName,msg){
    this.errors[fieldName]=msg;
    this.errors.count++;
};

exports.Validator=Validator;