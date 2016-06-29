var express = require('express');
var app = express();
var fs = require('fs');
var availableConncections = {};
var availableUsers = [];
var availbaleRooms = [{id:'1',name:'Common'},{id:'2',name:'Male'},{id:'3',name:'Female'}];

var isUsernameAvailable = function(username){  
  return availableUsers.filter(function(item){
    return item.userName==username;
  }).length == 0;
}
var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
app.use(express.static("C:/wamp/www/chat/express/client"));

app.on('request',function(req,res){
    console.log('get request');
});

app.get("/chat/client", function (req, res, next) {
     res.sendFile('C:/wamp/www/chat/express/client/index.html');
})
app.get("/chat/server*", function (req, res, next) {
  console.log(req.query);
  var callFunc = req.query.callFunc || null;//defines the name of function that will be called inside
  var roomId = req.query.roomId || '1';//send message to particular room
  var userName = req.query.userName || '';//username of the connection(should be unique)
  var receiverName = req.query.receiverName || '';//name to the receiver.
  var message = req.query.message || '';//message to be send.
  console.log(callFunc);
  switch(callFunc){    
  case "connect":
      /*Code for connection starts*/
      if(isUsernameAvailable(userName))//means username already used
      {   
          /*Setting response header*/   
          res.header("Access-Control-Allow-Origin", "*");
          res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
          res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
          res.header('Content-Type','text/event-stream');
          res.header('Cache-Control','no-cache');
          res.header('Connection','keep-alive');
          res.connection.setTimeout(0);
          console.log(userName+' connected in room '+roomId);
          availableUsers.push({userName:userName,roomId:roomId});      
          // creating a hash array to use response later.
          availableConncections[userName] = res;

          broadcast({allUsers:availableUsers,roomId:roomId,event:'usersUpdated',data:JSON.stringify(availableUsers)});
          broadcast({allUsers:availableUsers,roomId:roomId,event:'userConnected',data:JSON.stringify({"userName":userName,"roomId":roomId})});          
      }
      else
      {           
          sendEventSourceMsg(res,"messageReceived","Oops... "+userName+" already used by another person.");          
      }    
    /*Code for connection ends*/
    break;
  case "disconnect":
    /*Code for disconnect starts*/    
        console.log("User with userName("+userName + ') gone');
        broadcast({allUsers:availableUsers,roomId:roomId,event:"userDisconnected",data:JSON.stringify({"userName":userName,"roomId":roomId})});                  
        broadcast({allUsers:availableUsers,roomId:roomId,event:"usersUpdated",data:JSON.stringify(availableUsers)});                  

        /*Removing references of this user from this file.*/
        availableUsers = availableUsers.filter(function(item){
          return item.userName!==userName;
        });
        availableConncections[userName] = null;
    /*Code for disconnect ends*/
    break;
  case "sendMessageToReceiver":
    /*Code for broadcasting message to all users of the same room starts*/
      if(receiverName != ''){    
        sendAjaxRes(res);
        var allUsers = availableUsers.filter(function(item){
          return item.roomId==roomId && (item.userName==receiverName || item.userName==userName);
        });           
        broadcast({allUsers:allUsers,roomId:roomId,event:"messageReceived",data:JSON.stringify({"sender":userName,"message":message})});                          
      }
    /*Code for broadcasting message to all users of the same room ends*/
    break;
  case "broadcastMessage":
    /*Code for broadcasting message to all users of the same room starts*/
    if(message !=''){
        console.log('got broadcast message,roomId = '+roomId);
        sendAjaxRes(res); 
        var allUsers = availableUsers.filter(function(item){
          return item.roomId==roomId || item.userName==userName;
        });
        broadcast({allUsers:allUsers,roomId:roomId,event:"messageReceived",data:JSON.stringify({"sender":userName,"message":message})});                                  
    }
    /*Code for broadcasting message to all users of the same room ends*/
    break;
  case "getAllRooms":
    /*Code for sending users information of a room to requested user*/    
        console.log('getAllRooms');
        sendAjaxRes(res); 
        sendEventSourceMsg(availableConncections[userName],"roomsUpdated",JSON.stringify(availbaleRooms));
    /*Code for broadcasting message to all users of the same room ends*/
    break;
  case "getUsersByRoomId":
    /*Code for sending users information of a room to requested user*/    
        console.log('getUsersByRoomId, roomId = '+roomId);
        sendAjaxRes(res); 
        var allUsers = availableUsers.filter(function(item){
          return item.roomId==roomId;
        });
        sendEventSourceMsg(availableConncections[userName],"usersUpdated",JSON.stringify(allUsers));        
    /*Code for broadcasting message to all users of the same room ends*/
    break;
  case "changeRoom":
    /*Code for sending users information of a room to requested user*/    
        console.log('Inside changeRoom function');
        sendAjaxRes(res);         
        // getting current user object by username
        var user = availableUsers.filter(function(item){
          return item.userName===userName;
        })[0];
        var prevUserRoomId = user.roomId;
        user.roomId = roomId;
        //update user list of current room
        console.log('broadcasting availableUsers with roomId = '+prevUserRoomId);
        broadcast({allUsers:availableUsers,roomId:prevUserRoomId,event:"usersUpdated",data:JSON.stringify(availableUsers)});
        //update user list of new room
        console.log('updting roomId and broadcasting availableUsers with roomId = '+roomId);        
        broadcast({allUsers:availableUsers,roomId:roomId,event:"usersUpdated",data:JSON.stringify(availableUsers)});
    /*Code for broadcasting message to all users of the same room ends*/
    break;
  }
  
  /*Removing user from list when browsers reloads or closed*/
  req.on('close',function(req,res){      
      /*Code for disconnect starts*/    
        console.log("User with userName("+userName + ') gone');
        broadcast({allUsers:availableUsers,roomId:roomId,event:"userDisconnected",data:JSON.stringify({"userName":userName,"roomId":roomId})});                  
        broadcast({allUsers:availableUsers,roomId:roomId,event:"usersUpdated",data:JSON.stringify(availableUsers)});                  

        /*Removing references of this user from this file.*/
        availableUsers = availableUsers.filter(function(item){
          return item.userName!==userName;
        });
        availableConncections[userName] = null;
    /*Code for disconnect ends*/
  });
  // below code is removed because due to this code there is a continous hit to nodejs server.
  //res.end();  
  //next();
});

/*Broadcasting eventsource message to all users in a particular group*/
function broadcast(obj){
  for (var i = obj.allUsers.length - 1; i >= 0; i--) {
    var user = obj.allUsers[i];
    if(availableConncections[user.userName]){
      sendEventSourceMsg(availableConncections[user.userName],obj.event,obj.data);
    }        
  };
}

function sendAjaxRes(res){
  /*Setting response header*/   
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Content-Type','application/json');
  res.json({"status": "OK"});
}

function sendEventSourceMsg(res,event,data){
  res.write("event: "+event+"\n");    
  res.write("data: "+data+"\n\n");  
}