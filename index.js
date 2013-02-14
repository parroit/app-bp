var server=require("./lib/server/server");
exports.useDb=server.useDb;
exports.config=server.app.config;
exports.runControllers=server.runControllers;

var auth=exports.auth=require("./lib/server/auth");
var markdown =  exports.markdown=require("./lib/server/markdown");
var validator = exports.validator=require("./lib/server/validator");
auth.init && auth.init(server.app);
markdown.init && markdown.init(server.app);
validator.init && validator.init(server.app);


exports.mongoId = function (hexId) {
    var BSON = require('mongodb').BSONPure;
    return BSON.ObjectID.createFromHexString(hexId);
};

exports.async=require("async");