define(function (require, exports, module) {
    exports.initModule = function (app) {
        app.angularApp.directive('ngCloseDialog', ngCloseDialog);
        app.angularApp.directive('ngOpenDialog', ngOpenDialog);
        app.angularApp.directive('text', function(){return new Text();});
        app.angularApp.directive('password', function(){return new Password();});
        app.angularApp.directive('email', function(){return new Email();});
        app.angularApp.directive('combo', function(){return new Combo();});
        app.angularApp.directive('number', function(){return new Number();});
        app.angularApp.directive('phone', function(){return new Phone();});

        app.angularApp.directive('textInline', function(){return new TextInline();});
        app.angularApp.directive('passwordInline', function(){return new PasswordInline();});
        app.angularApp.directive('emailInline', function(){return new EmailInline();});
        app.angularApp.directive('comboInline', function(){return new ComboInline();});
        app.angularApp.directive('numberInline', function(){return new NumberInline();});
        app.angularApp.directive('phoneInline', function(){return new PhoneInline();});

        app.angularApp.directive('cell', cell);


        app.error=function(msg){
            app.message(msg,"error");
        }

        var messages={};

        app.message=function(msg,type){
            var maxTop=0;
            var height=0;
            for(var k in messages){
                if (messages.hasOwnProperty(k)){
                    var top=parseInt($('#'+k).css("top").replace("px",""));
                    if (top>maxTop) {
                        maxTop=top;
                        height=parseInt($('#'+k).css("height").replace("px",""));
                    }
                }
            }

            var id=GUID();
            var m=$('<div id="'+id+'" class="inbox-message alert ' + (type=="error"?'alert-error':'alert-success') +'">'+
                '<a class="close" data-dismiss="alert" href="#">&times;</a>'+
                '<img src="img/ok.png"/>'+
                '<p>'+msg +'</p>'+
            '</div>');
            m.css("top",(maxTop+height+40)+"px");
            $("body").append(m);
            messages[id]=null;
            var startFade;
            function hideMessage(){
                startFade=setTimeout(function(){
                    startFade=null;
                    $("#"+id).fadeOut({
                        duration:5000,
                        complete:function(){
                            $("#"+id).remove();
                            delete messages[id]
                        }
                    });
                },500);
            }

            $("#"+id).hover(function (){
                if (startFade){
                    clearTimeout(startFade);
                    startFade=null;
                }else{
                    m.stop();
                }
                m.css("opacity",1);
            },hideMessage);

            hideMessage();

        }

        app.GUID = GUID;

    };


    function cell(){
        return {
            restrict : 'E',
            replace : false,
            scope : {
                error:'@error',
                model:'@model'
            },
            template:'<div><span ng-bind="model"></span>'+
                        '<i ng-class="{hidden:!error}"'+
                        '    class="cell-error pull-right icon-red icon-exclamation-sign"'+
                        '    data-content="{{error}}"'+
                        '    data-original-title="Errore nei dati"'+
                        '    data-toggle="popover"'+
                        '    data-trigger="hover"'+
                        '    data-placement="top">'+
                        '</i>'+
                    '</div>',
            link : function (scope, element, attrs) {
                element.find("i").popover({trigger:'hover'});
            }
        };
    }



    function AbstractField(fieldType,inline) {
        this.template=this.createTemplate(fieldType,inline);
        this.inline=inline;
    }

    AbstractField.prototype.restrict = 'E';
    AbstractField.prototype.replace = true;
    AbstractField.prototype.scope = {
        label:'@label',
        error:'@error',
        model:'=model',
        change:'&change'

    };

    AbstractField.prototype.createTemplate = function(fieldType,inline){
        return (inline?"<div class='inline-block'>":'<div ng-class="{\'control-group\':true,error:error}">') +
                '<label class="control-label" for="{{fieldId}}">{{label}}</label>' +
                (inline?'':'<div class="controls">') +
                    '<input class="{{width}}" type="' + fieldType + '" ng-change="change()" ng-model="model" id="{{fieldId}}"/>' +
                    (inline?
                        '<i ng-class="{hidden:!error}"'+
                        '    class="cell-error pull-right icon-red icon-exclamation-sign"'+
                        '    data-content="{{error}}"'+
                        '    data-original-title="Errore nei dati"'+
                        '    data-toggle="popover"'+
                        '    data-trigger="hover"'+
                        '    data-placement="top">'+
                        '</i>'
                    :
                        '<span class="help-inline" ng-bind="error"></span>'
                    ) +
                (inline?'':'</div>') +
            '</div>';
    };


    AbstractField.prototype.link = function (scope, element, attrs) {
        element.find("i").popover({trigger:'hover'});
        scope.fieldId = GUID();

        if (attrs.width){
            scope.width=attrs.width;
        }


    };

    function Text() {}
    Text.prototype=new AbstractField('text',false);
    function TextInline() {}
    TextInline.prototype=new AbstractField('text',true);

    function Number() {}
    Number.prototype=new AbstractField('number',false);
    function NumberInline() {}
    NumberInline.prototype=new AbstractField('number',true);

    function Password() {}
    Password.prototype=new AbstractField('password',false);
    Password.prototype.link = function (scope, element, attrs) {
        element.find("i").popover({trigger:'hover'});
        scope.fieldId = GUID();
        setTimeout(function(){
            $('#'+scope.fieldId).pstrength();
        },10);


    };


    function PasswordInline() {}
    PasswordInline.prototype=new AbstractField('password',true);
    PasswordInline.prototype.link = Password.prototype.link;

    function Phone() {}
    Phone.prototype=new AbstractField('tel',false);
    function PhoneInline() {}
    PhoneInline.prototype=new AbstractField('tel',true);

    function Email() {}
    Email.prototype=new AbstractField('email',false);

    function EmailInline() {}
    EmailInline.prototype=new AbstractField('email',true);

    function AbstractCombo(inline) {
        this.template=this.createTemplate(inline);
    }
    AbstractCombo.prototype=new AbstractField('',false);
    AbstractCombo.prototype.createTemplate = function(inline){
        return (inline?"<div class='inline-block'>":'<div ng-class="{\'control-group\':true,error:error}">') +
                '<label class="control-label" for="{{fieldId}}">{{label}}</label>' +
                (inline?'':'<div class="controls">') +
                    '<select id="{{fieldId}}" '+
                        'ng-options="tmp.value as tmp.label for tmp in options"'+
                        'ng-model="model">'+
                    '</select>'+
                    (inline?
                        '<i ng-class="{hidden:!error}"'+
                            '    class="cell-error pull-right icon-red icon-exclamation-sign"'+
                            '    data-content="{{error}}"'+
                            '    data-original-title="Errore nei dati"'+
                            '    data-toggle="popover"'+
                            '    data-trigger="hover"'+
                            '    data-placement="top">'+
                            '</i>'
                    :
                        '<span class="help-inline" ng-bind="error"></span>'
                    ) +
                (inline?'':'</div>') +
            '</div>';
    };

    AbstractCombo.prototype.scope = {
        label:'@label',
        error:'@error',
        model:'=model',
        options:'=options'
    };


    function Combo() {}
    Combo.prototype=new AbstractCombo(false);

    function ComboInline() {}
    ComboInline.prototype=new AbstractCombo(true);





    function ngCloseDialog() {
        return {
            link:function (scope, element, attrs) {
                function closeDialog() {
                    var fn = scope.$eval(attrs.ngCloseDialog);
                    fn(function () {
                        var element = angular.element(attrs.ngDialog);

                        element.modal('hide');
                    });

                }

                element.bind('click', closeDialog);
            }
        };
    }

    function ngOpenDialog() {
        return {
            link:function (scope, element, attrs) {
                function openDialog() {
                    scope.$eval(attrs.ngOpenDialog);
                    var element = angular.element(attrs.ngDialog);

                    element.modal('show');
                }

                element.bind('click', openDialog);
            }
        };
    }


    function GUID() {
        var S4 = function () {
            return Math.floor(
                Math.random() * 0x10000 /* 65536 */
            ).toString(16);
        };

        return (
            S4() + S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + S4() + S4()
            );
    }
});
