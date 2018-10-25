/**
 * Created by rohan on 01/01/18.
 */

var express=require('express');
var app=express();
// var bodyParser = require('body-parser');
var shortid = require('shortid');
var server=require('http').createServer(app);
var io=require('socket.io').listen(server);
var md5=require ('md5');
var mysql=require('./utils');
var Map = require("collections/map");
var moment=require('moment');
const async = require('async')


var rabbit=require('./rabbitconnection');
// var fs = require('fs');
// var im = require('imagemagick');
var serverToken ="ChikoopApp@chikoop.com";
var hashgeneratedToken=md5(serverToken);

var redis = require('redis');
var redisClient = redis.createClient({host : 'localhost', port : 6379});

redisClient.on('ready',function() {
 console.log("Redis is ready");
});

redisClient.on('error',function() {
 console.log("Error in Redis");
});

// app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

// server.listen(process.env.PORT || 8040,'localhost');
// server.listen(process.env.PORT || 8040,'127.0.0.1');

// console.log ("server running .....");
// console.log("Visit localhost:3000");

 //app.set('host', '45.55.213.207');

//server.listen(3000, ()=>  {
//     console.log ("server running .....");
//     console.log("Visit localhost:3000");
// //});

server.listen(process.env.PORT || 3000,'localhost');

//server.listen(process.env.PORT || 3000,'127.0.0.1');
server.listen(3000, ()=> {
    console.log ("server running .....");
console.log("Visit localhost:3000");
console.log('db at myrhband.tech');
});




// var obj={
//   socket:null,
//   isavailable:true
// };

// console.log(shortid.generate());



var activeUsers=new Map();
// var activesockets=new Map();
// var groups=new Map();


app.get('/',function (req, res) {
    res.send("Chat Server is up and running");
});



io.sockets.on ('connection',function (socket) {
// console.log ('Socket.io server running on port 3000');
// console.log ('User connected with socketid'+socket.id);

socket.auth=false;

    rabbit.connection.createChannel(function (err, channel) {

        var Username;
    socket.on('authenticate',function (data) {
       var token=data.token;
        Username=data.username;
        var session=data.session;
        // console.log('username is '+Username);
       // console.log ('Token received is '+token);
        if (hashgeneratedToken==token){
            socket.auth=true;
            console.log('Connection is authenticated '+socket.id);
            console.log("User is :",data.username);
            socket.emit('authenticate',true);

            //mysql.InsertIntoUsers(Username);

            var obj=[];
            obj.Socket=socket;
            obj.isavailable=false;

            activeUsers.set(Username,obj);
            redisClient.hexists(Username,"mobile",function(err,reply) {
                   if(!err) {
                         if(reply === 1) {
                         console.log("Key exists");
                        } else {
                         console.log("Doesn't exists");
                         redisClient.hmset(Username,"mobile",Username,"session",session,function(err,reply) {
                            console.log(err);
                             console.log(reply);
                             });
                               }
                            }
                    });

            // activesockets.set(socket.id,Username);

            //Declaring a queue as a username and start consuming it
            channel.assertQueue(Username+session,{durable: true});

            channel.consume(Username+session,function (msg) {
                //console.log('consumed the message');

                /**
                 * Code for routing
                 */
                var originalcontent=JSON.parse(msg.content.toString());

                if (originalcontent.needack) {

                    var Message = {};
                    Message.content = originalcontent;
                    Message.redelievery = msg.fields.redelivered;
                    socket.emit('msg', Message, function (confirmation) {
                        if (confirmation) {
                            //console.log('Got confirmation');
                            redisClient.hget(originalcontent.sender,"session",function(err,reply) {
                                 console.log(err);
                                  console.log(reply);

                            channel.ack(msg);
                            var ack = {msgid: originalcontent.msgid, status: 2};
                            channel.sendToQueue(originalcontent.sender+reply, new Buffer(JSON.stringify(ack)), {persistent: true});
                            });
                        }
                    });
                }else{

                    if (originalcontent.status){
                        //console.log('status is',originalcontent.status);
                        socket.emit('onstatus',originalcontent,function (confirmation) {
                            if (confirmation){
                                channel.ack(msg);
                            }
                        });

                        /**
                         * This clause for handling group based messages
                         */
                    }else{
                        console.log('Entering into group APIs');
                        var Message = {};
                        Message.content = originalcontent;
                        Message.redelievery = msg.fields.redelivered;
                        socket.emit('broadcastmsgtogrp', Message, function (confirmation) {
                            if (confirmation) {
                                //console.log('Got confirmation');
                                channel.ack(msg);
                            }
                        });

                    }
                }

                // setTimeout(function () {
                //     channel.nack(msg);
                // },2000);

            }, {noAck : false });


            // console.log('Total activeusers are ' + activeUsers.get(Username));
        }
    });


    socket.on('disconnect',function () {
        console.log('Disconnected '+socket.id);

        try {
            // something that seems to fail often
            channel.close();
        }
        catch (err) {
            console.warn(err.stack);
            console.warn(err.stackAtStateChange);
        }

        if (socket.auth){
            console.log('Socket was authenticated');
            //redisClient.get()
            activeUsers.get(Username).isavailable=false;
            // activeUsers.delete(activesockets.get(socket.id));
            // activesockets.delete(socket.id);

        }else{
            console.log('Socket wasnt authenticated');
        }
    });

    socket.on('sendpmmsg2',function (data,callback) {


      redisClient.hmset(Username,"session",data.newsession,function(err,reply) {
         console.log(err);
          console.log("Updated Session",reply);
          });

        var msgid=shortid.generate();
        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');
        data.msgid=msgid;
        channel.sendToQueue(data.receiver,new Buffer(JSON.stringify(data)),{persistent : true});
        callback(msgid);

    });

    socket.on('setsession',function(data,callback){
      redisClient.hmset(data.user_id,"session",data.session,function(err,reply) {
         console.log(err);
          console.log("Updated Session",reply);
          callback(true);
          });
    });

        //Tested
    socket.on('sendpmmsg',function (data,callback) {

        var msgid=shortid.generate();
        //console.log('send pm msg function got called , generated id',msgid);
        //console.log(data);
        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');
        data.msgid=msgid;
        // console.log('here');
        // var combined_user_id=data.sender+':'+data.receiver;
        // mysql.GetTotalMessages(combined_user_id,function (number) {
        //     mysql.InsertIntototalmessages(combined_user_id);
        //     mysql.InsertIntomessages(combined_user_id,number+1,data.sender,data.data);
        // });
        redisClient.hget(data.receiver,"session",function(err,reply) {
             console.log(err);
              console.log("Recevier Session",reply);
              channel.sendToQueue(data.receiver+reply,new Buffer(JSON.stringify(data)),{persistent : true});
              callback(msgid);
        });


        // if (activeUsers.get(data.receiver)!=undefined){
        //     // Add here the timestamp
        //     data.timestamp=moment().format('YYYY-MM-DD HH:mm:ss');
        //
        //     activeUsers.get(data.receiver).Socket.emit('sendpmmsg',data);
        // }
        // if (data.isfirstmsg){
        //     mysql.AddUserConnection(data.sender,data.receiver);
        //     mysql.AddUserConnection(data.receiver,data.sender);
        // }
        // console.log('here');
        // var combined_user_id=data.sender+':'+data.receiver;
        // mysql.GetTotalMessages(combined_user_id,function (number) {
        //     mysql.InsertIntototalmessages(combined_user_id);
        //     mysql.InsertIntomessages(combined_user_id,number+1,data.sender,data.data);
        // });

    });

        //Tested
    socket.on('sendreadack',function (data, callback) {
        //console.log('send read ack got called');
        data.status=3;

        redisClient.hget(data.receiver,"session",function(err,reply) {
             console.log(err);
              console.log(reply);
              channel.sendToQueue(data.receiver+reply, new Buffer(JSON.stringify(data)), {persistent: true});
              callback(true);
        });


    });
    //data={senderusername,true/false}

        //Tested
    socket.on('setavailable',function (data,callback) {


      //console.log ("setavailable got called");
      //activeUsers.get(data.sender).isavailable=data.setavail;

      //lastseen api modification
    /*  if(!activeUsers.get(data.sender).isavailable)
      {
          //cuurent millis hasbeen set
          activeUsers.get(data.sender).lastseen=data.lastseen;
          //console.log('current user online :'+activeUsers.get(data.sender).isavailable+' lastseen '+moment(activeUsers.get(data.sender).lastseen).utcOffset('+0530').format('YYYY-MM-DD HH:mm'));
      }*/
      if(!data.setavail){
        redisClient.hmset(data.sender,["lastseen",data.lastseen.toString(),"online",data.setavail.toString()],function(err,res){
          console.log(err);
          console.log("Setvail called",res);
          callback(true);
        })

      }else{
        redisClient.hmset(data.sender,"online",data.setavail.toString(),function(err,res){
          console.log(err);
          console.log("Setvail called",res);
          callback(true);
        })
      }



    });

        //Tested
    socket.on('getavailable',function (data, callback) {
        //console.log("getavailable got called");
        //

        redisClient.hget(data.username,"online",function(err,isonline){
          console.log(err);
          console.log(data.username+" is online",isonline);
          if(isonline=='true'){
               callback(true,"");
          }else{
            redisClient.hget(data.username,"lastseen",function(err,lastseen){
              console.log(err);

              var lastseenTime=moment().utcOffset('+0530').subtract((moment().valueOf()-lastseen),'milliseconds').calendar();
             //var lastseenTime=moment().utcOffset('+0530').subtract((moment().valueOf(lastseen),'milliseconds').calendar();
              //console.log('lastseen get available is called userid '+data.username+' :'+lastseenTime);
              callback(false,lastseenTime.toString());
              console.log(data.username+" lastseen is ",lastseenTime);
            })

               }
        })
      /*  if (activeUsers.get(data.username)==undefined){
            console.log('User not available ,so returns false');
            callback(false,"");
        }else{
            //console.log('User is available,returning previous state : userid :'+data.username);


            //last seen api modification
            if(!activeUsers.get(data.username).isavailable)
            {

                var lastseenTime=moment().utcOffset('+0530').subtract((moment().valueOf()-activeUsers.get(data.username).lastseen),'milliseconds').calendar();
                //console.log('lastseen get available is called userid '+data.username+' :'+lastseenTime);

                callback(false,lastseenTime.toString());

            }
            else
            {
            //console.log('User is online,returning previous state : userid :'+data.username);
            callback(activeUsers.get(data.username).isavailable,"");
            }
        }*/
    });

        //Tested
    socket.on('subscribetyping',function (data, callback) {
        //console.log('subscribe typing got called');
        socket.join(data.uniquegroupid);
        callback(true);
    });

        //Tested
        //error handler required on socket
    socket.on('typing',function (data) {
        if (data.group){
            //console.log('sending typing message to group');
            io.to(data.uniquegroupid).emit("typing",data);
        }else {
            //console.log('sending typing messsage to member',activeUsers.get(data.receiver));
            if (/*activeUsers.get(data.receiver).Socket!=undefined||*/activeUsers.get(data.receiver)!=undefined) {
               activeUsers.get(data.receiver).Socket.emit("typing", data);
            }
        }
    });

        //Tested
    socket.on('stoptyping',function (data) {
        if (data.group){
            //console.log('sending stop typing message to group');
            io.to(data.uniquegroupid).emit("stoptyping",data);
        }else {
            //console.log('sending stop typing messsage to member');
            if (activeUsers.get(data.receiver)!=undefined) {
                activeUsers.get(data.receiver).Socket.emit("stoptyping", data);
            }
        }
    });



        /**
         * Group APIs start here
         *
         */

    //Tested

    socket.on('creategroup',function (data,callback) {
        //console.log("creategroup has been called");

        var uniquegroupid=data.admin+shortid.generate();
        //Code to handle group details in database
        mysql.InsertIntoGroups(uniquegroupid,data.groupname,data.admin);
        mysql.AddGroupSubsribed(data.admin,uniquegroupid);
        channel.bindQueue(data.admin,rabbit.exchange,uniquegroupid);
        callback(uniquegroupid);
    });

        //Not tested
    socket.on('creategroupwithusers',function (data, callback) {
        //console.log("creategroup with users has been called");

        var uniquegroupid=data.admin+shortid.generate();
        //Code to handle group details in database
        console.log('users are',data.users);
        console.log('dp url is',data.gr_dp_url);
        mysql.InsertIntoGroups(uniquegroupid,data.groupname,data.admin);
        mysql.AddGroupSubsribed(data.admin,uniquegroupid);


        channel.bindQueue(data.admin,rabbit.exchange,uniquegroupid);
        callback(uniquegroupid);
    });
        //Normal message with id 1


    //Tested

    socket.on('addgroupmember',function (data,callback) {
       // console.log ("add group member called with gr id "+data.uniquegroupid);
        // // console.log ('receiver is '+data.receiver);
        // activeUsers.get(data.receiver).Socket.join(data.uniquegroupid);
        // io.to(data.uniquegroupid).emit("addgroupmember",data);
        //Code to handle database
        //25/4/18
        //commented db operation
        //mysql.AddMemberToGroup(data.uniquegroupid,data.receiver);
//rohan  mod       // mysql.AddGroupSubsribed(data.receiver,data.uniquegroupid);
        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');
//rohan modification 23/12/2017
        channel.assertQueue(data.receiver,{durable:true});
        channel.bindQueue(data.receiver,rabbit.exchange,data.uniquegroupid);
        channel.publish(rabbit.exchange,data.uniquegroupid,new Buffer(JSON.stringify(data)),{persistent : true});
        callback(true);
    });

    socket.on('addgroupmembermod',function (data,callback) {
        //console.log ("add group member mod called with gr id "+data.uniquegroupid);
        // // console.log ('receiver is '+data.receiver);
        // activeUsers.get(data.receiver).Socket.join(data.uniquegroupid);
        // io.to(data.uniquegroupid).emit("addgroupmember",data);
        //Code to handle database
        mysql.AddBulkMembersToGroup(data.uniquegroupid,data.users);
//rohan  mod       // mysql.AddGroupSubsribed(data.receiver,data.uniquegroupid);
        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');
//rohan modification 23/12/2017
      //  channel.bindQueue(data.receiver,rabbit.exchange,data.uniquegroupid);
        //channel.publish(rabbit.exchange,data.uniquegroupid,new Buffer(JSON.stringify(data)),{persistent : true});
        callback(true);
    });

        //Tested
        //Normal message with id 2
    socket.on('broadcastmsgtogrp',function (data, callback) {
        //console.log ('broadcast msg called');
        // io.to(data.uniquegroupid).emit("broadcastmsgtogrp",data);
        //
        // //Code to handle database
        // mysql.GetTotalMessages(data.uniquegroupid,function (number) {
        //     mysql.InsertIntototalmessages(data.uniquegroupid);
        //     mysql.InsertIntomessages(data.uniquegroupid,number+1,data.sender,data.message);
        // });
        var msgid=shortid.generate();
        console.log('send broadcast msg function got called , generated id',msgid);
        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');
        data.msgid=msgid;
        channel.publish(rabbit.exchange,data.uniquegroupid,new Buffer(JSON.stringify(data)),{persistent : true});
        callback(msgid);
    });

        //Tested
        //Normal message with id 3
    socket.on('removegroupmember',function (data,callback) {
        console.log('remove group member called , user is',data.user);
        mysql.RemoveMemberFromGroup(data.uniquegroupid,data.user);
        mysql.RemoveGroupSubsribed(data.user,data.uniquegroupid);
        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');

        channel.publish(rabbit.exchange,data.uniquegroupid,new Buffer(JSON.stringify(data)),{persistent : true});
        channel.unbindQueue(data.user,rabbit.exchange,data.uniquegroupid);
        callback(true);
    });

        //Tested
        //Normal message with id 7
    socket.on('unsubgr',function (data, callback) {
        console.log('unsubscribed group called');
        mysql.RemoveGroupSubsribed(data.user,data.uniquegroupid);
        mysql.RemoveMemberFromGroup(data.uniquegroupid,data.user);
        async.series([
        function(callback)
        {
         mysql.GetGroupLastAddedMemeber(data.uniquegroupid,function(lastmember)
          {
            callback(null,lastmember);
          })
        }
       ,function(callback)
       {
        mysql.GetAdmin(data.uniquegroupid,function(admin)
        {
          callback(null,admin)
        })
       }], (err, result) => {

        console.log(result)

        if(data.user==result[1])
        {
            mysql.SetAdmin(data.uniquegroupid,result[0]);
        }


       });


        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');
        channel.publish(rabbit.exchange,data.uniquegroupid,new Buffer(JSON.stringify(data)),{persistent : true});
        channel.unbindQueue(data.user,rabbit.exchange,data.uniquegroupid);
        callback(true);
    });

        //Not tested
        //Normal message with id 4
    socket.on('deletegroup',function (data, callback) {
        //console.log('delete group called');
        mysql.SetGroupDeleted(data.uniquegroupid);
        channel.publish(rabbit.exchange,data.uniquegroupid,new Buffer(JSON.stringify(data)),{persistent : true});
        callback(true);
    });

        //Tested
        //Normal message with id 5
    socket.on('chgrname',function (data, callback) {
        //console.log('change group name called');
        mysql.ChangeGroupName(data.uniquegroupid,data.nname);
        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');
        channel.publish(rabbit.exchange,data.uniquegroupid,new Buffer(JSON.stringify(data)),{persistent : true});
        callback(true);
    });

        //Tested
    socket.on('getgroupmemberinfo',function (data, callback) {
        //console.log('get group member info called');
        mysql.GetGroupMemberInfo(data.uniquegroupid,function (row) {
            callback(row);
        });

    });


        //Tested
    //Normal message with id 6
    socket.on('chgrdp',function (data, callback) {
       // console.log('change group dp called');
        mysql.ChangeGroupdp(data.uniquegroupid,data.nurl);
        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');

        data.receivers.forEach(function(receiver)
        {
       channel.assertQueue(receiver,{durable:true});
        channel.bindQueue(receiver,rabbit.exchange,data.uniquegroupid);
        })
        //rohan mod bind queue 25/12/2017

        //
        var msgid=shortid.generate();
        data.timestamp=moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss');
        data.msgid=msgid;
        channel.publish(rabbit.exchange,data.uniquegroupid,new Buffer(JSON.stringify(data)),{persistent : true});
        callback(msgid);
    });

        //Tested
    socket.on('chmyname',function (data, callback) {
        console.log('change my name called');
        mysql.ChangeMyName(data.userid,data.nname);
        callback(true);
    });

        //Tested
    socket.on('chmystatus',function (data, callback) {
        console.log('change my status called');
        mysql.ChangeMyStatus(data.userid,data.nstatus);
        callback(true);
    });

        //Tested
    socket.on('chmydp',function (data, callback) {
        console.log('change my dp called');
        mysql.ChangeMyDp(data.userid,data.nurl);
        callback(true);
    });

        //Tested
    socket.on('getuserinfo',function (data, callback) {
        console.log('getuserinfocalled');
        mysql.GetUserInfo(data.username,function (row) {
            callback(row);
        })
    });


        //Tested
    socket.on('getusergroupsinfo',function (data, callback) {
        console.log('get user group info called');
        mysql.GetUserGroupInfo(data.username,function (row) {
           callback(row);
        });
    });

    //data.sender , data.receiver , group : true/false , uniquegroupid,

     //Tested
     socket.on('getgroupinfo',function (data, callback) {
         console.log('get group info called');
         mysql.GetGroupInfo(data.uniquegroupid,function (row) {
            callback(row);
         });
     });

     //nname
     socket.on('setadmin',function (data, callback) {
       console.log('set admin got called');
       mysql.SetAdmin(data.uniquegroupid,data.nname);
       callback(true);
     });

    setTimeout(function () {
        if (!socket.auth){
            console.log('Discoonecting the socket'+socket.id);
            socket.disconnect();
        }
    },2000);

    });

});




// scp index.html package.json server.js utils.js rabbitconnection.js sudchikoop@chikoop.com:/home/sudchikoop/ChikoopChatServer/
// Remote135@$
