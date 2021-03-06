'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

var playersArr = []
var currentMap = []

wss.on('connection', (ws) => {
  ws.isAlive = true;
  var clientId = randomId(16);
  playersArr.push({x:0,y:0,id:clientId,color:"#000000"});
  
  console.log( JSON.stringify(playersArr) );
  
  console.log('Client *'+clientId+'* connected');
  ws.on('message', function incoming(msg) {
    var message = msg.toString()
    var index = getPlayerIndex(clientId)
    if(message.startsWith('NAME')){
      var name = message.split('-')[1];
      playersArr[index].name=name
      console.log('Client *'+clientId+'* has chosen its name and it is: '+name)
    }
    else if(message.startsWith('COLOR')){
      var color = message.split('-')[1]
      playersArr[index].color = color
    }
    else if(message==='RES-MOVE_UP'){
      var index = playersArr.findIndex(function(item,i){return item.id===clientId})
      playersArr[index].y-=5
    }
    else if(message==='RES-MOVE_DOWN'){
      var index = playersArr.findIndex(function(item,i){return item.id===clientId})
      playersArr[index].y+=5
    }
    else if(message==='RES-MOVE_LEFT'){
      var index = playersArr.findIndex(function(item,i){return item.id===clientId})
      playersArr[index].x-=5
    }
    else if(message==='RES-MOVE_RIGHT'){
      var index = playersArr.findIndex(function(item,i){return item.id===clientId})
      playersArr[index].x+=5
    }
    if(playersArr[index].x>300){playersArr[index].x=0}
    if(playersArr[index].x<0){playersArr[index].x=300}
    if(playersArr[index].y>300){playersArr[index].y=0}
    if(playersArr[index].y<0){playersArr[index].y=300}
    currentMap.forEach(block=>{ if(block.x==playersArr[index].x&&block.y==playersArr[index].y){
        playersArr[index].x = 0
        playersArr[index].y = 0
      }
    })
    
    ws.send( JSON.stringify(playersArr) )
    ws.send( "map-"+JSON.stringify(currentMap) )
  })
  
  ws.on('close', function close() {
    console.log('Client *'+clientId+'* disconnected')
    playersArr.splice( playersArr.findIndex(function(item, i){return item.id===clientId}) ,1)
  });
  ws.on('pong', heartbeat);
});
wss.on('close', function close() {
  clearInterval(interval);
})

var playerDataSender = setInterval(function sendData() {
  wss.clients.forEach(function each(ws) {
    ws.send( JSON.stringify(playersArr) )
  });
}, 1);

const interval  = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);
function getPlayerIndex(id){
  for(var i=0;i<playersArr.length;i++){
    if(playersArr[i].id==id){
      return i
    }
  }
}
function randomId(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}
function noop(){}
function player(x,y,id){
  this.x = x
  this.y = y
  this.id = id
}
function heartbeat(){
  this.isAlive = true;
}
