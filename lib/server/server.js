var http = require("http");
var url = require("url");
var connect = require("connect");

var Router = require('barista').Router;
var router = new Router;
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var SessionDiskStore = require('./SessionDiskStore');



require("jinjs").registerExtension(".jinja2");

var controllers;
var selectedDbName;
exports.useDb = function (dbName) {
    selectedDbName = dbName;
};

var fs = require('fs');
var path = require('path');
readFileSync = fs.readFileSync;
var baseViewFolder=__dirname;

function requireView(viewName) {
    console.log("Requiring view "+viewName);

    var customPath = path.join(baseViewFolder ,path.join("../../../../server/view/",viewName));
    if (fs.existsSync(customPath+".jinja2")){
        console.log("Requiring custom view "+path.join("../../../../server/view/",viewName));
        return require(path.join("../../../../server/view/",viewName));
    } else{
        console.log("Requiring standard view "+path.join("./view/",viewName));
        return require("./"+path.join("view",viewName));
    }


}

function view_path(viewName){
    var customPath = path.join(process.cwd(),path.join("./view/",viewName));
    if (fs.existsSync(customPath+".jinja2")){
        console.log("Requiring custom view "+path.join("../../../../server/view/",viewName));
        return require(customPath);
    } else{
        console.log("Requiring standard view "+path.join("./view/",viewName));
        return require(path.join(baseViewFolder,"view/"+viewName));
    }

}


exports.runControllers = function (ctrls) {
    controllers = ctrls;
    controllers.auth = require("./auth");
    var app = connect()
        .use(connect.favicon())
        .use(connect.bodyParser())
        .use(connect.query())
        .use(connect.logger('dev'))
        .use(connect.static('../client'))
        .use(connect.static('../node_modules/app-bp/lib/client'))
        .use(connect.static('../node_modules/app-bp/node_modules/html5-boilerplate-npm'))
        .use(connect.static('../node_modules/app-bp/node_modules/bootstrap-npm'))
        //.use(connect.directory('public'))
        .use(connect.cookieParser())
        .use(connect.session({ secret:'my cat is anacleto', store:new SessionDiskStore() }))
        .use(route);
    http.createServer(app).listen(8888);
    console.log("Server has started.");


    for (var ctrl in controllers) {
        if (controllers.hasOwnProperty(ctrl)) {
            setup_routes("", controllers[ctrl], router)
        }
    }

    for (var ctrl in controllers) {
        if (controllers.hasOwnProperty(ctrl)) {
            var onAppStart = controllers[ctrl].onAppStart;
            if (onAppStart) {
                var context = new Context(null, null, null);
                onAppStart.apply(context, context.args);

            }
        }
    }
}


function setup_routes(prefix, ctrl, router) {
    var Get = function (url, target) {
        return router.get(url).to(target)
    }
    var Post = function (url, target) {
        return router.post(url).to(target)
    }
    var Put = function (url, target) {
        return router.put(url).to(target)
    }
    var Del = function (url, target) {
        return router.del(url).to(target)
    }


    function add_routes(routes, addRoute) {
        if (routes) {
            for (var url in routes) {
                if (routes.hasOwnProperty(url)) {
                    addRoute(prefix + url, routes[url]);

                }
            }
        }

    }

    if (!ctrl.name){
        throw new Error("Please define name in controllers. E.g.:exports.name='index';");

    }

    if (!ctrl.routes){
        throw new Error("Please define routes in controller "+ctrl.name+". E.g.:exports.routes={get:{'/index':'posts.index@jinja:index'}};");

    }
    add_routes(ctrl.routes.get, Get);
    add_routes(ctrl.routes.post, Post);
    add_routes(ctrl.routes.del, Del);
    add_routes(ctrl.routes.put, Put);
}

function Context(request, response, routed) {

    this.request = request;
    this.response = response;
    if (request != null)
        this.current = url.parse(request.url).pathname;

    var args = [];
    this.namedArgs = {};
    if (routed != null) {
        for (var name in routed) {
            if (routed.hasOwnProperty(name) && "controller,action,method".indexOf(name) == -1) {
                args.push(routed[name]);
                this.namedArgs[name] = routed[name];
            }
        }

    }
    this.args = args;

    return this;
}
Context.prototype.createMongoClient = function () {
    return new Db(selectedDbName, new Server("127.0.0.1", 27017, {}), {w:1});
}
Context.prototype.onCollection = function (collection, callback) {
    var client = this.createMongoClient();
    if (this.response) {
        this.response.on('finish', function () {
            client.close();
        });
    }

    client.open(function (err, p_client) {
        if (err)
            throw new Error(err);
        else
            client.collection(collection, function (err, collection) {
                if (err)
                    throw new Error(err);
                else
                    callback(client, collection, client);
            });
    });
}


function action(caption, image, onclick) {
    return '<li><a onclick="' + onclick + '">' +
        '<i class="icon-' + image + '"></i> ' + caption + '</a></li>';
}



function renderTemplate(context, response, controller, viewName, controllerResults) {
    var path = require('path');
    var toDelete = [];
    var suffix = ".jinja2";
    for (var key in require.cache)
        if (key.indexOf(suffix, this.length - suffix.length) !== -1)
            toDelete.push(key);

    toDelete.forEach(function (key) {
            delete require.cache[key]
        }
    );
    //toDelete.forEach(function(key){console.log(key)});

    var template = requireView(viewName);
    return template.render({
        view_path:view_path,
        context:context,
        results:controllerResults
    });
}

function getStackTrace(err) {

    return err.stack;
}
;

function getParamNames(func) {
    var funStr = func.toString();
    return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
}

function route(request, response) {
    var pathname = url.parse(request.url).pathname;
    var routed = router.first(pathname, request.method);
    var context = new Context(request, response, routed);

    if (routed) {
        var dest = routed.action.split("@");

        var controller = controllers[routed.controller];
        var controllerAction = controller[dest[0]];
        var view = dest[1];

        if (!controller){
            throw new Error("Server controller not found:"+routed.controller);
        }
        if (!controllerAction){
            throw new Error("Server controller action not found:"+routed.action);
        }
        if (!view){
            throw new Error("Server view not found:"+routed.action);
        }
        function renderErrTemplate(statusCode, viewName2, args) {
            var resultErr = "";
            try {
                var resultErr = renderTemplate(context, response, controller, viewName2, args);
                response.writeHead(statusCode, {"Content-Type":"text/html"});
                response.end(resultErr);
            } catch (err) {
                response.end("An arror has occurred during page generation.\r\n\r\nerror message:\r\n" + err);
            }


        }

        function executeController() {
            try {
                var args = [];
                var arguments = getParamNames(controllerAction);
                for (var arg in arguments) {
                    if (context.namedArgs.hasOwnProperty(arguments[arg])) {
                        args.push(context.namedArgs[arguments[arg]]);
                    }
                }

                controllerAction.apply(context, args);
            } catch (err) {

                context.onError(err, getStackTrace(err));

            }
        }

        function render(controllerResults, onEnd) {

            var viewName = controller.name + "/" + view.replace("jinja:", "");
            var result = renderTemplate(context, response, controller, viewName, controllerResults);
            response.writeHead(200, {"Content-Type":"text/html"});
            response.end(result);
            if (onEnd)
                onEnd();

        }

        render.onError = function (err, stacktrace) {


            var args = {
                err:{
                    message:err.toString().replace("<", "&lt;"),
                    stacktrace:stacktrace.toString().replace("<", "&lt;").replace(/\n/g, "<br/>\n")
                }
            };
            console.log(err);
            console.log(stacktrace);

            renderErrTemplate(500, "error", args);
        }
        function renderJson(controllerResults, onEnd) {
            response.writeHead(200, {"Content-Type":"application/json"});

            response.end(JSON.stringify(controllerResults));
            if (onEnd)
                onEnd();

        }

        renderJson.onError = function (err, stacktrace) {
            try {
                response.writeHead(500, {"Content-Type":"application/json"});
            } catch (e) {
            }
            var args = {
                status:"error",
                error:{
                    message:err.toString().replace("<", "&lt;"),
                    stacktrace:stacktrace.toString().replace("<", "&lt;")
                }
            };
            console.log(err);
            console.log(stacktrace);
            response.end(JSON.stringify(args));
        }
        context.redirect = function (url) {
            response.writeHead(303, {
                "Content-Type":"text/html",
                'Location':url
            });

            response.end("This page has moved to:" + url);
        }
        context.unauthorized = function () {
            response.writeHead(401, {
                "Content-Type":"text/html"

            });

            response.end("You are not authorized to use this resource");
        }

        var renderer;
        if (dest[1].indexOf("jinja:") == 0) {
            renderer = render;
        } else
            renderer = renderJson;

        function executeRenderer(controllerResults) {
            try {
                renderer(controllerResults);
            } catch (err) {
                renderer.onError(err, getStackTrace(err));

            }
        }

        process.on('uncaughtException', function (err) {
            context.onError(err, getStackTrace(err));
        });
        context.renderer = executeRenderer;
        context.onError = renderer.onError;
        executeController();

    } else {
        renderErrTemplate(404, "notfound", {
            url:pathname.replace("<", "&lt;")
        });
    }


}


