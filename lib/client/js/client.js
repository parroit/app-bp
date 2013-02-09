function ClientApp(appName) {
    this.appName = appName;
    this.appPath = appName + "/app-module.js";

}

ClientApp.prototype.load = function () {
    var self = this;
    window[self.appName] = self.angularApp = angular.module(self.appName, []);



    self.name = self.appName;
    require([this.appPath], function (module) {

        var dependencies = [];
        for (var i = 0, l = module.dependencies.length; i < l; i++) {
            var dep = module.dependencies[i];
            dependencies.push(self.appName + "/" + dep + "/" + dep + "-module");
        }
        for (var i = 0, l = module.coreDependencies.length; i < l; i++) {
            var dep = module.coreDependencies[i];
            dependencies.push(dep + "/" + dep + "-module.js");
        }


        require(dependencies, function () {
            module.initModule && module.initModule(self);

            var depentenciesModules = arguments;

            for (var i = 0, l = depentenciesModules.length; i < l; i++) {
                var dep = depentenciesModules[i];
                dep.initModule && dep.initModule(self);
            }
            module.modulesInitDone && module.modulesInitDone(self);

            self.angularApp.config(['$routeProvider', function ($routeProvider) {

                for (var i = 0, l = depentenciesModules.length; i < l; i++) {
                    var dep = depentenciesModules[i];
                    dep.route && dep.route($routeProvider);
                }



            }]);


            angular.bootstrap(document,[self.appName]);
        });
    });
}

ClientApp.createFrom = function (scriptPath) {
    var app = new ClientApp(scriptPath);
    app.load();
    return app;
};


