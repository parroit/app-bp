define(function (require, exports, module) {
    exports.initModule = function (app) {
        app.angularApp.directive('ngCloseDialog', ngCloseDialog);
        app.angularApp.directive('ngOpenDialog', ngOpenDialog);
        app.angularApp.directive('text', function(){return new Text();});
        app.angularApp.directive('password', function(){return new Password();});
        app.angularApp.directive('email', function(){return new Email();});
        app.angularApp.directive('combo', function(){return new Combo();});
        app.angularApp.directive('numeric', function(){return new Numeric();});
        app.angularApp.directive('phone', function(){return new Phone();});
        app.angularApp.directive('memo', function(){return new Memo();});
        app.angularApp.directive('markdown', function(){return new MarkdownMemo();});

        app.angularApp.directive('textInline', function(){return new TextInline();});
        app.angularApp.directive('passwordInline', function(){return new PasswordInline();});
        app.angularApp.directive('emailInline', function(){return new EmailInline();});
        app.angularApp.directive('comboInline', function(){return new ComboInline();});
        app.angularApp.directive('numericInline', function(){return new NumericInline();});
        app.angularApp.directive('phoneInline', function(){return new PhoneInline();});
        app.angularApp.directive('dateInline', function(){return new DateInline();});
        app.angularApp.directive('date', function(){return new Date();});

        app.angularApp.directive('cell', cell);


        app.error=function(msg){
            app.message(msg,"error");
        };

        var messages={};

        app.message=function(msg,type){
            var maxTop=0;
            var height=0;
            for(var k in messages){
                if (messages.hasOwnProperty(k)){
                    var msgElm = $('#'+k);
                    var top=parseInt(msgElm.css("top").replace("px",""));
                    if (top>maxTop) {
                        maxTop=top;
                        height=parseInt(msgElm.css("height").replace("px",""));
                    }
                }
            }

            var id=guid();
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

        };

        app.GUID = guid;

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
        scope.fieldId = guid();

        if (attrs.width){
            scope.width=attrs.width;
        }


    };

    function Text() {}
    Text.prototype=new AbstractField('text',false);
    function TextInline() {}
    TextInline.prototype=new AbstractField('text',true);

    function Numeric() {}
    Numeric.prototype=new AbstractField('numeric',false);
    function NumericInline() {}
    NumericInline.prototype=new AbstractField('numeric',true);

    function Password() {}
    Password.prototype=new AbstractField('password',false);
    Password.prototype.link = function (scope, element, attrs) {
        element.find("i").popover({trigger:'hover'});
        scope.fieldId = guid();
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

    function Memo() {
        var inline=this.inline=false;
        this.template=(inline?"<div class='inline-block'>":'<div ng-class="{\'control-group\':true,error:error}">') +
            '<label class="control-label" for="{{fieldId}}">{{label}}</label>' +
            (inline?'':'<div class="controls">') +
            '<textarea class="{{width}}" rows="{{rows}}" id="{{fieldId}}" '+
            'ng-model="model">'+
            '</textarea>'+
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
    }
    Memo.prototype=new AbstractField('',false);
    Memo.prototype.link = function (scope, element, attrs) {
        element.find("i").popover({trigger:'hover'});
        scope.fieldId = guid();

        if (attrs.width){
            scope.width=attrs.width;
        }

        if (attrs.rows){
            scope.rows=attrs.rows;
        }

    };
    function MarkdownMemo() {
        var inline=this.inline=false;
        this.template=(inline?"<div class='inline-block'>":'<div ng-class="{\'control-group\':true,error:error}">') +
            '<label class="control-label" for="{{fieldId}}">{{label}}</label>' +
            (inline?'':'<div class="controls">') +
            '<div class="wmd-panel">'+
            '<div id="wmd-button-bar-{{fieldId}}"></div>'+

                '<textarea class="space-above wmd-input {{width}}" id="wmd-input-{{fieldId}}" '+
                'ng-model="model">'+
                '</textarea>'+
            '</div>'+
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
    }
    MarkdownMemo.prototype=new AbstractField('',false);


    MarkdownMemo.prototype.link = function (scope, element, attrs) {
        element.find("i").popover({trigger:'hover'});
        scope.fieldId = guid();

        if (attrs.width){
            scope.width=attrs.width;
        }
        setTimeout(function(){
            var converter = Markdown.getSanitizingConverter();
            var editor = new Markdown.Editor(converter,"-"+scope.fieldId);
            editor.run();
        },10);

    };

    

    function AbstractCombo(inline) {
        this.template=this.createTemplate(inline);
    }
    AbstractCombo.prototype=new AbstractField('',false);
    AbstractCombo.prototype.createTemplate = function(inline){
        return (inline?"<div class='inline-block'>":'<div ng-class="{\'control-group\':true,error:error}">') +
                '<label class="control-label" for="{{fieldId}}">{{label}}</label>' +
                (inline?'':'<div class="controls">') +
                    '<select class="{{width}}" id="{{fieldId}}" '+
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

    function Date() {

    }
    Date.prototype=new AbstractField('date',false);

    function DateInline() {

    }
    DateInline.prototype=new AbstractField('date',true);




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
});
