(function(){
	angular.module('services',[]).factory('EventSourceService',['$rootScope','$http',function($rootScope,$http){
		function createEventSource(userName){
			if(!window.eventSource){
				var source = window.eventSource = new EventSource(Constants.serverPath+'?callFunc=connect&userName='+userName);
				source.addEventListener('userConnected', function (e) {
					//trigger user connected event to all child scopes.
					$rootScope.$broadcast('userConnected',JSON.parse(e.data));
					console.log('EventSourceService usersConnected');
				});	
				source.addEventListener('usersUpdated', function (e) {
					//trigger users updated event to all child scopes.
					$rootScope.$broadcast('usersUpdated',JSON.parse(e.data));			
					console.log('EventSourceService usersUpdated');
				});
				source.addEventListener('roomsUpdated', function (e) {
					//trigger users updated event to all child scopes.
					$rootScope.$broadcast('roomsUpdated',JSON.parse(e.data));			
					console.log('EventSourceService roomsUpdated');
				});
				source.addEventListener('messageReceived', function (e) {
					//trigger message event to all child scopes.
					$rootScope.$broadcast('messageReceived',JSON.parse(e.data));			
					console.log('EventSourceService message',e.data);
				});
				source.addEventListener('userDisconnected', function (e) {
					//trigger message event to all child scopes.
					//checking if the disconnected user is the same user receiving the event.if yes, then empty the event source.
					var data = JSON.parse(e.data);					
					$rootScope.$broadcast('userDisconnected',data);								
					console.log('EventSourceService userDisconnected',e.data);
				});
			}
		}	
		
		return {
			send : function(chatObj,callBack){
				//message,roomId,recieverName			
				if(chatObj.receiverName !== '')//means sending to a particular reciever
					$http.get(Constants.serverPath+'?callFunc=sendMessageToReceiver&userName='+chatObj.userName+'&message='+chatObj.message+'&receiverName='+chatObj.receiverName+'&roomId='+chatObj.roomId);
				else//means broadcasting message
					$http.get(Constants.serverPath+'?callFunc=broadcastMessage&userName='+chatObj.userName+'&message='+chatObj.message+'&roomId='+chatObj.roomId);
			},
			connect : function(chatObj,callBack){
				//userName,roomId			
				//adding event listener on event source object
				$rootScope.$on('userConnected',function(event,data){
					callBack && callBack(data);
				});
				//creating eventsource object
				createEventSource(chatObj.userName);			
			},
			getUsersByRoomId : function(chatObj,callBack){
				$http.get(Constants.serverPath+'?callFunc=getUsersByRoomId&userName='+chatObj.userName+'&roomId='+chatObj.roomId);
			},
			getAllRooms : function(chatObj,callBack){
				$http.get(Constants.serverPath+'?callFunc=getAllRooms&userName='+chatObj.userName);
			},
			changeRoom : function(chatObj,callBack){
				var http = $http.get(Constants.serverPath+'?callFunc=changeRoom&userName='+chatObj.userName+'&roomId='+chatObj.roomId);
				callBack && http.success(function(data, status, headers, config) {
					callBack(data);
				})
			},
			disconnect : function(chatObj,callBack){
				$http.get(Constants.serverPath+'?callFunc=disconnect&userName='+chatObj.userName+'&roomId='+chatObj.roomId);
			}
		};
	}]);
})();