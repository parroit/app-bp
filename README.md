app-bp
======

Boilerplate code for modern application based on node,angular,h5bp and twitter bootstrap

**Getting started**

Create a folder for your app, then install app-bp
running the command:

npm install app-bp

to create stubs for your app, run the command:

node app-stubs app-name (actually not implemented)

**Configuring the app**

To configure the app, write a JSON file named config.json
under the server subdirectory of your app home.

Here is an example and some explanation of the content of
 the configuration file:

    {
        "client":{

        },
        "server":{
            "port":8889,
            "auth":{
                "admin":{
                    "username":"admin_username",
                    "password":"<admin password>",
                    "nome":"<admin name>",
                    "cognome":"<admin surname>",
                    "email":"<admin e-mail>"
                },
                "allowRegister":false
            },
            "mailer":{
               "host":"your.smtpserver.net",
               "username":"<smtp user>",
               "password":"<smtp password>"
            },
            "mongo":{
                "host":"mongo_server_address",
                "port": mongo_server_port
            }
        }
    }

* client is not used at the moment, but is thought to contain configuration that wil be visible to the
angular.js client part.

* server node contains configuration only visible to the server side of the site app.

* server.port is the port node will be port node will listen on.

* server.auth section contains configuration of the authorization module. server.auth.admin are self-explanatory
    properties of the default admin user that is created on first site app run.
    Property server.auth.allowRegister allow to show or hide the register new user link page of the app site.

* server.mailer configuration node contains properties used by the mailer to connect to your stmp host.

* server.mongo property contains host and port of your mongodb.
 You can also change the name of your mongodb database by calling

    app.useDb('<dbname>');

 in your site starting javascript file.

** examples **

You can find some example of the use of the library here:

* https://github.com/parroit/app-bp-threeexample

* https://github.com/parroit/app-bp-siteexample

* https://github.com/parroit/app-bp-todoexample

