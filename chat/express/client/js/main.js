var chatApp = angular.module('chatApp',['services','providers','directives']);
chatApp.controller('MainController', ['$scope','EventSourceService','$rootScope','$sce', function($scope,EventSourceService,$rootScope,$sce){
	$scope.broadcast = false;//broadcast the message to all connected users
	$scope.roomId = null;//send message to particular room
	$scope.receiver = {};//name to the receiver.
	$scope.users = [];
	$scope.user = null;
	$scope.rooms = [];
	$scope.selectedRoom;
	$scope.connected = false;
	$scope.message = "";
	$scope.messages = "";
	$scope.connect = function(){
		EventSourceService.connect({userName:$scope.user.userName},function(data){
			$scope.$apply(function(){
				if($scope.user.userName===data.userName){
					$scope.user = data;
					$scope.connected = true;
					EventSourceService.getAllRooms({userName:$scope.user.userName});
				}	
				
				var prepend = '<span  style="color:green"><b>'+data.userName+' connected... </b></span>';
				$scope.messages = prepend + "<br/>" + $scope.messages;				
			});			
		});

	}
	$scope.getTrustedHTML = function(str){
		return $sce.trustAsHtml(str);
	}
	$scope.send = function(){
		EventSourceService.send({userName:$scope.user.userName,message:$scope.message,roomId:$scope.selectedRoom.id,receiverName:$scope.receiver.userName||''});
		$scope.message = "";
		
	}
	
	$scope.selectReceiver = function(user){
		$scope.receiver = user;
	}

	$scope.disconnect = function(){		
		EventSourceService.disconnect({userName:$scope.user.userName,roomId:$scope.selectedRoom.id});
		$scope.user = null;
		$scope.receiver = {};
		$scope.selectedRoom = null;
		$scope.messages = "";
		$scope.message = "";
		$scope.connected = false;
	}
	
	$scope.moveToRoom = function(room,event){		
		EventSourceService.changeRoom({roomId:room.id,userName:$scope.user.userName},function(data){
			var previousRoom = $scope.rooms.filter(function(item){				
		        return item.id==($scope.selectedRoom && $scope.selectedRoom.id || 0);
	      	});
	      	$scope.selectRoom(room);
		});
		event.stopImmediatePropagation();
	}

	$scope.selectRoom = function(room){
		$scope.selectedRoom = room;
		EventSourceService.getUsersByRoomId({roomId:$scope.selectedRoom.id,userName:$scope.user.userName});
	}

	/*Listening events from event source*/
	$rootScope.$on('usersUpdated',function(event,data){
		$scope.$apply(function(){
			$scope.users = data.filter(function(item){
		        return true;//item.userName!=$scope.user.userName;
	      	});	      	
		});	
	});

	$rootScope.$on('roomsUpdated',function(event,data){		
		$scope.$apply(function(){
			var previousRoom = data.filter(function(item){				
		        return item.id==($scope.selectedRoom && $scope.selectedRoom.id || 0);
	      	});
			$scope.rooms = data.filter(function(item){				
		        return true;//item.userName!=$scope.user.userName;
	      	});
	      	$scope.selectedRoom = previousRoom.length>0 ? previousRoom[0] : $scope.rooms[0];
		});	
	});

	$rootScope.$on('userDisconnected',function(event,data){
		if($scope.user.userName===data.userName){
			window.eventSource = null;
		}
		$scope.$apply(function(){
			var prepend = '<span  style="color:blue"><b>'+data.userName+' disconnected... </b></span>';
			$scope.messages = prepend + "<br/>" + $scope.messages;
		});			
	});

	$rootScope.$on('messageReceived',function(event,data){
		$scope.$apply(function(){
			var prepend = "";
			if(data.sender === $scope.user.userName){
				prepend = '<span  style="color:red"><b>'+data.sender+' : </b>'+data.message+'</span>';
			}
			else{
				prepend = '<b>'+data.sender+' : </b>'+data.message;
			}
			$scope.messages = prepend + "<br/>" + $scope.messages;
		});	
	});
}]);