/**
 * Module dependencies.
 */

var Store = require('connect/lib/middleware/session/store');

/**
 * Initialize a new `SessionDiskStore`.
 *
 * @api public
 */

var SessionDiskStore = module.exports = function SessionDiskStore() {

};

/**
 * Inherit from `Store.prototype`.
 */

SessionDiskStore.prototype.__proto__ = Store.prototype;

/**
 * Attempt to fetch session by the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
 */

SessionDiskStore.prototype.get = function (sid, fn) {
    //console.log("get " + sid);
    var self = this;
    process.nextTick(function () {
        var expires;
        var fs = require("fs");

        fs.readFile(getSessionPath(sid), "utf-8", function (err, sess) {
            if (sess) {
                sess = JSON.parse(sess);
                if ('string' == typeof sess.cookie.expires)
                    expires = new Date(sess.cookie.expires);
                else
                    expires = sess.cookie.expires;


                if (!expires || new Date() < expires) {
                    console.log("ok " + sid);
                    fn(null, sess);
                } else {
                    console.log(sid + " expired on " + sid);
                    self.destroy(sid, fn);
                    fn();
                }
            } else {
                if (err && err.code!="ENOENT")
                    console.log(sid+" not found: " + err);
                fn();
            }
        });
    });
};

function getSessionPath(sid) {
    return "sessions/" + new Buffer(sid).toString('base64') + ".txt";
}
/**
 * Commit the given `sess` object associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Session} sess
 * @param {Function} fn
 * @api public
 */

SessionDiskStore.prototype.set = function (sid, sess, fn) {
    console.log("set " + sid);
    var self = this;
    process.nextTick(function () {


        var fs = require('fs');
        var content = JSON.stringify(sess, null, '\t');
        fs.writeFile(getSessionPath(sid), content, function (err) {
            if (err) {
                console.log(err);
            }
            fn && fn();

        });

    });
};

/**
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * @api public
 */

SessionDiskStore.prototype.destroy = function (sid, fn) {
    console.log("destroy " + sid);
    var self = this;
    process.nextTick(function () {
        var fs = require('fs');

        fs.unlink(getSessionPath(sid), fn);

    });
};

/**
 * Invoke the given callback `fn` with all active sessions.
 *
 * @param {Function} fn
 * @api public
 */

SessionDiskStore.prototype.all = function (fn) {
    console.log("all ");
    var fs = require('fs');
    var async = require('async');

    function FileReader(f) {
        this.read = function (callback) {
            this.get(f, callback);
        };
        return this;
    }

    fs.readdir("sessions", function (err, files) {
        var arr = [];
        for (var file in files) {

            //noinspection JSUnfilteredForInLoop
            arr.push(
                new FileReader(file).read
            );
        }
        async.parallel(arr, function (err, results) {
            fn(null, results);
        });

    });


};

/**
 * Clear all sessions.
 *
 * @param {Function} fn
 * @api public
 */

SessionDiskStore.prototype.clear = function (fn) {
    console.log("clear ");
    var fs = require('fs');
    fs.unlink("sessions", function (err) {
        if (!err) {
            fs.mkdir("sessions", 770, function (err) {

            })
        }
    })

};

//noinspection JSValidateTypes
/**
 * Fetch number of sessions.
 *
 * @param {Function} fn
 * @api public
 */

SessionDiskStore.prototype.length = function (fn) {
    var fs = require('fs');
    console.log("length ");
    fs.readdir("sessions", function (err, files) {
        fn(null, files.length);
    });

};
