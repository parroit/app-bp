define(function (require, exports, module) {
    var dsApp = null;

    function ngRole($http) {
        return {
            link:function (scope, element, attrs) {
                function checkVisibility() {
                    if (!dsApp.user || attrs.ngRole.indexOf(dsApp.user.ruolo) == -1)
                        element[0].className = element[0].className + " hidden";
                    else
                        element[0].className = element[0].className.replace(/hidden/g, "");
                }

                dsApp.doOnLogout.push(checkVisibility);
                dsApp.doOnLogin.push(checkVisibility);

                dsApp.checkUserLogged($http, function () {
                    checkVisibility();
                });

            }
        };
    }


    function ngLoginLogout($http) {
        return {
            link:function (scope, element) {
                function changeUserStatus() {
                    if (!dsApp.user) {
                        element.html('<!--suppress HtmlUnknownTarget --><a href="bv#/login" class="addToolTip" title="Esegui il login con i tuoi dati"><span class="label">anonymous:Login</span> </a>');
                    }
                    else {
                        element.html('<!--suppress HtmlUnknownTarget --><a href="bv#/logout" class="addToolTip" title="Esegui il logout"><span class="label">' + dsApp.user.username + ':Logout</span></a>');
                    }
                }

                dsApp.doOnLogout.push(changeUserStatus);
                dsApp.doOnLogin.push(changeUserStatus);
                dsApp.checkUserLogged($http, function () {
                    changeUserStatus();
                });

            }
        };
    }

    function redirectUnauthorized($httpProvider) {

        var $http, interceptor = ['$q', '$injector', function ($q, $injector) {

            function success(response) {
                return response;
            }

            function error(response) {
                if (response.status === 401) {

                    // get $http via $injector because of circular dependency problem
                    var $location = $injector.get('$location');
                    $location.path("/login");

                }
                return $q.reject(response);
            }

            return function (promise) {
                return promise.then(success, error);
            }
        }];

        $httpProvider.responseInterceptors.push(interceptor);
    }

    var onLogin = function () {
        for (var i = 0, l = dsApp.doOnLogin.length; i < l; i++) {
            dsApp.doOnLogin[i]();
        }
    };
    var onLogout = function () {
        for (var i = 0, l = dsApp.doOnLogout.length; i < l; i++) {
            dsApp.doOnLogout[i]();
        }
    };

    var ProfileCtrl = function ($scope, $http, $location) {
        function init() {
            checkUserLogged($http, function () {
                $scope.user = dsApp.user;
            });

        }

        $scope.save = function () {
            $http.post("save-profile", {user:$scope.user}).success(function (data) {
                if (data.status == "error")
                    dsApp.error(data.error);
                else
                    dsApp.user = $scope.user;
            });
        };
        init();
    };

    var ResetPassword = function ($scope, $http, $location) {


        $scope.email = "";

        $scope.sendResetMail = function () {

            $http.post("reset-password", {email:$scope.email}).success(function (data) {
                if (data.status == "error")
                    $scope.error = data.error;
                else {
                    dsApp.message("La mail con la nuova password ti è stata inviata.");
                    $location.path("/login");
                }
            });
        };
    };

    var Login = function ($scope, $http, $location) {

        $scope.remember = false;
        $scope.username = "";
        $scope.password = "";


        $scope.login = function () {
            var params = {
                username:$scope.username,
                password:$scope.password,
                remember:$scope.remember
            };
            $http.post("login", {params:params}).success(function (data) {
                if (data.status == "error")
                    $scope.error = data.error;
                else {
                    dsApp.message("Ti sei autenticato.");
                    dsApp.user = data.user;
                    onLogin && onLogin();
                    $location.path("/index");
                }
            });
        }
    };


    var Logout = function ($scope, $http, $location) {
        $http.post("logout").success(function (data) {
            if (data.status == "error")
                $scope.error = data.error;
            else {
                dsApp.user = null;
                onLogout && onLogout();
                $location.path("/login");
            }
        });

    };
    var Users = function ($scope, $http, $location) {
        function getUsers() {
            $http.get("users").success(function (data) {
                if (data.status == "error")
                    alert(data.error);
                else {
                    $scope.users = data.results;

                }
            });
        }

        function init() {
            checkUserLogged($http, function () {
                if (dsApp.user.ruolo == "adm") {
                    getUsers();
                } else {
                    $location.path("/login");
                }
            })
        }

        $scope.openEditUser = function () {
            $scope.editUser = this.u;
            $scope.editUser.error=null;
            $scope.$apply();
        };
        $scope.openNewUser = function () {
            $scope.editUser = {};
            $scope.$apply();
        };
        $scope.remove = function () {

            $http.post("user/delete/" + this.u._id).success(function (data) {
                if (data.status == "error")
                    alert(data.error);
                else {
                    alert("Utente cancellato");
                    getUsers();
                }
            });
        };
        $scope.ruoli = [
            {value:"adm", label:"Amministratore"},
            {value:"cst", label:"Cliente"},
            {value:"usr", label:"Utente"}

        ];

        $scope.saveUser = function (closeDialog) {
            var newUser = false;
            if (!$scope.editUser._id) {
                $scope.editUser._id = $scope.editUser.username;
                newUser=true;
            }
            $http.post("user/" + $scope.editUser._id, {user:$scope.editUser}).success(function (data) {
                if (data.status == "error") {
                    alert(data.error);

                }

                else if (data.status == "invalid") {
                    $scope.editUser.error = data.error;


                } else {
                    alert("Utente salvato");

                    if (newUser) {
                        $scope.users.push($scope.editUser);
                        setTimeout(function(){
                            $scope.$apply();
                        },100);

                    }
                    $scope.editUser = null;
                    closeDialog();
                }
            });

        };
        init();
    };

    var checkUserLogged = function ($http, onLogged) {
        if (dsApp.user == null) {
            $http.get("checkUserLogged").success(function (data) {
                if (data.status == "error")
                    alert(data.error);
                else {
                    dsApp.user = data.user;
                    onLogged && onLogged();
                }
            });
        } else
            onLogged && onLogged();
    };

    exports.initModule = function (app) {
        dsApp = app;
        dsApp.doOnLogin = [];
        dsApp.doOnLogout = [];
        dsApp.user = null;
        dsApp.checkUserLogged = checkUserLogged;
        app.angularApp.config(['$httpProvider', redirectUnauthorized]);
        app.angularApp.directive('ngRole', ngRole);
        app.angularApp.directive('ngLoginLogout', ngLoginLogout);
    };
    exports.route = function ($routeProvider) {
        $routeProvider.
            when('/profile', {templateUrl:'/auth/profile.html', controller:ProfileCtrl}).
            when('/', {templateUrl:'/auth/login.html', controller:Login}).
            when('/login', {templateUrl:'/auth/login.html', controller:Login}).
            when('/reset-password', {templateUrl:'/auth/reset-password.html', controller:ResetPassword}).
            when('/logout', {templateUrl:'/auth/logout.html', controller:Logout}).
            when('/users', {templateUrl:'/auth/users.html', controller:Users});
    };
});
