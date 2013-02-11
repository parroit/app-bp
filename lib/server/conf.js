exports.Conf=Conf=function(){};
var app;
exports.init=function($app){app=$app};

Conf.prototype.load=function(){
    var fs=require("fs");
    var config=JSON.parse(fs.readFileSync("./config.json"));
    this.server=config.server;
    this.client=config.client;
    return this;
};
