var app = angular.module("chatRoom", []);

app.factory('socket', function($rootScope) {
    var socket = io(); //默认连接部署网站的服务器
    return {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {   //手动执行脏检查
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});

app.factory('userService', function($rootScope) {
    return {
        get: function(users, nickname) {
            if (users instanceof Array) {
                for (var i = 0; i < users.length; i++) {
                    if (users[i].nickname === nickname) {
                        return users[i];
                    }
                }
            } else {
                return null;
            }
        }
    };
});

app.controller("chatCtrl", ['$scope', 'socket', 'userService', function($scope, socket, userService) {
    var messageWrapper = $('.message-wrapper');
    $scope.hasLogined = false;
    $scope.receiver = "";//默认是群聊
    $scope.publicMessages = [];//群聊消息
    $scope.privateMessages = {};//私信消息
    $scope.messages = $scope.publicMessages;//默认显示群聊
    $scope.users = [];//
    

    $scope.login = function() {
        if ($scope.nickname.length > 30) {
            window.location.href = "./banned.html";
        } else {
            if (containsBadWords($scope.nickname)){
                alert("请友好交流，用户名含有粗鲁语言！！！！")
            }
            document.title = "聊天室 - 交流";
            socket.emit("addUser", { nickname: $scope.nickname });
        }
    }

    $scope.scrollToBottom = function() {
        messageWrapper.scrollTop(messageWrapper[0].scrollHeight);
    }

    var badWords = ["操你妈", "傻逼", "滚蛋", "亡号亲", "大SB", "cnm", "艹", "我是SB", "SSSSBBBB", "系统提示", "系统", "婊子", "fuck", "shit", "你妈", "你大爷", "你妹", "你娘", "你大爷", "你个垃圾", "你个笨蛋", "你个傻逼", "你个煞笔", "你个王八蛋", "你个垃圾", "你个笨蛋", "你个傻逼", "你个煞笔", "你个王八蛋", "你个垃圾", "你个笨蛋", "你个傻逼", "你个煞笔", "你个王八蛋", "你个垃圾"];
    
    function containsBadWords(message) {
        for (var i = 0; i < badWords.length; i++) {
            var regex = new RegExp(badWords[i], "g");
            if (regex.test(message)) {
                return true;
            }
        }
        return false;
    }
    var sayBadWordscount = 0;
    $scope.postMessage = function() {
        var msg = { text: $scope.words, type: "normal", from: $scope.nickname, to: $scope.receiver };
        var rec = $scope.receiver;
        if (containsBadWords(msg.text)) {
            sayBadWordscount++;
        }else{
            if (rec) {  //私信
                if (!$scope.privateMessages[rec]) {
                    $scope.privateMessages[rec] = [];
                }
                $scope.privateMessages[rec].push(msg);
            } else { //群聊
                $scope.publicMessages.push(msg);
            }
            $scope.words = "";
            if (rec !== $scope.nickname) { //排除给自己发的情况
                socket.emit("addMessage", msg);
            }
        }
        
        
    }

    $scope.setReceiver = function(receiver) {
        $scope.receiver = receiver;
        if (receiver) { //私信用户
            if (!$scope.privateMessages[receiver]) {
                $scope.privateMessages[receiver] = [];
            }
            $scope.messages = $scope.privateMessages[receiver];
        } else {//广播
            $scope.messages = $scope.publicMessages;
        }
        var user = userService.get($scope.users, receiver);
        if (user) {
            user.hasNewMessage = false;
        }
    }

    socket.on('userAddingResult', function(data) {
        if (data.result) {
            $scope.userExisted = false;
            $scope.hasLogined = true;
        } else {
            $scope.userExisted = true;
        }
    });

    socket.on('userAdded', function(data) {
        if (!$scope.hasLogined) return;
        $scope.publicMessages.push({ text: data.nickname, type: "welcome" });
        $scope.users.push(data);
    });

    socket.on('allUser', function(data) {
        if (!$scope.hasLogined) return;
        $scope.users = data;
    });

    socket.on('userRemoved', function(data) {
        if (!$scope.hasLogined) return;
        $scope.publicMessages.push({ text: data.nickname, type: "bye" });
        for (var i = 0; i < $scope.users.length; i++) {
            if ($scope.users[i].nickname == data.nickname) {
                $scope.users.splice(i, 1);
                return;
            }
        }
    });
    $scope.jump = function() {
        window.href.jump = "sysm.html";
        return 0;
    };
    
    $scope.checkInput = function(input) {
        if (input.includes('[飞天熊]')) {
            // 展示表情包逻辑
            var message = { text: input, type: "emoji", from: $scope.nickname, to: $scope.receiver };
            
            // 将表情包消息加入到相应的消息列表中
            if ($scope.receiver) {
                if (!$scope.privateMessages[$scope.receiver]) {
                    $scope.privateMessages[$scope.receiver] = [];
                }
                $scope.privateMessages[$scope.receiver].push(message);
            } else {
                $scope.publicMessages.push(message);
            }
    
            // 清空输入框
            $scope.words = "";
    
            // 发送消息
            if ($scope.receiver !== $scope.nickname) {
                socket.emit("addMessage", message);
            }
        }
        else if (input.includes('[顶]')) {
            // 展示表情包逻辑
            var message = { text: input, type: "emoji-2", from: $scope.nickname, to: $scope.receiver };
            
            // 将表情包消息加入到相应的消息列表中
            if ($scope.receiver) {
                if (!$scope.privateMessages[$scope.receiver]) {
                    $scope.privateMessages[$scope.receiver] = [];
                }
                $scope.privateMessages[$scope.receiver].push(message);
            } else {
                $scope.publicMessages.push(message);
            }
    
            // 清空输入框
            $scope.words = "";
    
            // 发送消息
            if ($scope.receiver !== $scope.nickname) {
                socket.emit("addMessage", message);
            }
        }
        
        else if (input.includes('[额]')) {
            // 展示表情包逻辑
            var message = { text: input, type: "emoji-3", from: $scope.nickname, to: $scope.receiver };
            
            // 将表情包消息加入到相应的消息列表中
            if ($scope.receiver) {
                if (!$scope.privateMessages[$scope.receiver]) {
                    $scope.privateMessages[$scope.receiver] = [];
                }
                $scope.privateMessages[$scope.receiver].push(message);
            } else {
                $scope.publicMessages.push(message);
            }
    
            // 清空输入框
            $scope.words = "";
    
            // 发送消息
            if ($scope.receiver !== $scope.nickname) {
                socket.emit("addMessage", message);
            }
        }
        else if (input.includes('[思考]')) {
            // 展示表情包逻辑
            var message = { text: input, type: "emoji-4", from: $scope.nickname, to: $scope.receiver };
            
            // 将表情包消息加入到相应的消息列表中
            if ($scope.receiver) {
                if (!$scope.privateMessages[$scope.receiver]) {
                    $scope.privateMessages[$scope.receiver] = [];
                }
                $scope.privateMessages[$scope.receiver].push(message);
            } else {
                $scope.publicMessages.push(message);
            }
    
            // 清空输入框
            $scope.words = "";
    
            // 发送消息
            if ($scope.receiver !== $scope.nickname) {
                socket.emit("addMessage", message);
            }
        }
        else if (input.includes('[啊]')) {
            // 展示表情包逻辑
            var message = { text: input, type: "emoji-5", from: $scope.nickname, to: $scope.receiver };
            
            // 将表情包消息加入到相应的消息列表中
            if ($scope.receiver) {
                if (!$scope.privateMessages[$scope.receiver]) {
                    $scope.privateMessages[$scope.receiver] = [];
                }
                $scope.privateMessages[$scope.receiver].push(message);
            } else {
                $scope.publicMessages.push(message);
            }
    
            // 清空输入框
            $scope.words = "";
    
            // 发送消息
            if ($scope.receiver !== $scope.nickname) {
                socket.emit("addMessage", message);
            }
        }
        else if (input.includes('[口吐芬芳]')) {
            // 展示表情包逻辑
            var message = { text: input, type: "emoji-6", from: $scope.nickname, to: $scope.receiver };
            
            // 将表情包消息加入到相应的消息列表中
            if ($scope.receiver) {
                if (!$scope.privateMessages[$scope.receiver]) {
                    $scope.privateMessages[$scope.receiver] = [];
                }
                $scope.privateMessages[$scope.receiver].push(message);
            } else {
                $scope.publicMessages.push(message);
            }
    
            // 清空输入框
            $scope.words = "";
    
            // 发送消息
            if ($scope.receiver !== $scope.nickname) {
                socket.emit("addMessage", message);
            }
        }   
        else if (input.includes('[正方体]')) {
            // 展示表情包逻辑
            var message = { text: input, type: "emoji-7", from: $scope.nickname, to: $scope.receiver };
            
            // 将表情包消息加入到相应的消息列表中
            if ($scope.receiver) {
                if (!$scope.privateMessages[$scope.receiver]) {
                    $scope.privateMessages[$scope.receiver] = [];
                }
                $scope.privateMessages[$scope.receiver].push(message);
            } else {
                $scope.publicMessages.push(message);
            }
    
            // 清空输入框
            $scope.words = "";
    
            // 发送消息
            if ($scope.receiver !== $scope.nickname) {
                socket.emit("addMessage", message);
            }
        }
    };
    

    socket.on('messageAdded', function(data) {
        if (!$scope.hasLogined) return;
        if (data.to) {
            if (!$scope.privateMessages[data.from]) {
                $scope.privateMessages[data.from] = [];
            }
            $scope.privateMessages[data.from].push(data);
        } else {
            $scope.publicMessages.push(data);
        }
        var fromUser = userService.get($scope.users, data.from);
        var toUser = userService.get($scope.users, data.to);
        if ($scope.receiver !== data.to) {
            if (fromUser && toUser.nickname) {
                fromUser.hasNewMessage = true;
            } else {
                toUser.hasNewMessage = true;
            }
        }else if (data.type === "images") {
            // 图片消息
            scope.info = data;
            scope.time = new Date();
        }
    });
    
    
    
    
}]);

app.directive('message', ['$timeout', function($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'message.html',
        scope: {
            info: "=",
            self: "=",
            scrolltothis: "&"
        },
        link: function(scope, elem, attrs) {
            scope.time = new Date();
            $timeout(scope.scrolltothis);
        }
    };
}]).directive('user', ['$timeout', function($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'user.html',
        scope: {
            info: "=",
            iscurrentreceiver: "=",
            setreceiver: "&"
        }
    };
}]);
