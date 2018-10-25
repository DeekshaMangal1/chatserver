const AWS = require('aws-sdk')
const async = require('async')
const bucketName = "earnchatmedia"
const path = require('path')
const fs = require('fs')
const requestVar = require('request');

//mysql object from util.js

const mysql=require('../utils')
const db=require('./db')
//
var shortid = require('shortid');
var pathParams, image, imageName;
var io = require('socket.io-client');
var md5=require ('md5');
var serverToken ="ChikoopApp@chikoop.com";
var hashgeneratedToken=md5(serverToken);

var objadmin={};
  objadmin.username='admincelgram'.toString();
  objadmin.token=hashgeneratedToken.toString();
  objadmin.session="7055743169rohan7055";

var socket = io.connect('http://localhost:3000',  {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax : 5000,
    reconnectionAttempts: 99999
} );
  socket.on('connect', function (msocket) {
     socket.emit('authenticate',objadmin);
     console.log('Connected!');

});

socket.emit('authenticate',objadmin);




/** Load Config File */
AWS.config.loadFromPath('config.json')


socket.on('disconnect',function () {
        console.log('Disconnected '+socket.id);

       /* try {
            // something that seems to fail often
           socket= io.connect('http://localhost:3000', {reconnect: true});
           socket.emit('authenticate',objadmin);


        }
        catch (err) {
            console.warn(err.stack);
            console.warn(err.stackAtStateChange);
        }*/

});



/** After config file load, create object for s3*/
const s3 = new AWS.S3({region: 'us-west-2'})
const createMainBucket = (callback) => {
	// Create the parameters for calling createBucket
	const bucketParams = {
	   Bucket : bucketName
	};
	s3.headBucket(bucketParams, function(err, data) {
	   if (err) {
	   	console.log("ErrorHeadBucket", err)
	      	s3.createBucket(bucketParams, function(err, data) {
			   if (err) {
			   	console.log("Error", err)
			      callback(err, null)
			   } else {
			      callback(null, data)
			   }
			});
	   } else {
	      callback(null, data)
	   }
	})
}



const createItemObject = (callback) => {
  const params = {
        Bucket: bucketName,
        Key: `${imageName}`,
        ACL: 'public-read',
        Body:image
    };
	s3.putObject(params, function (err, data) {
		if (err) {
	    	console.log("Error uploading image: ", err);
	    	callback(err, null)
	    } else {
	    	console.log("Successfully uploaded image on S3", data);
	    	callback(null, data)
	    }
	})
}


const createItemObjectModified = (imageName,image,callback) => {
  const params = {
        Bucket: bucketName,
        Key: imageName,
        ACL: 'public-read',
        Body:image
    };
	s3.putObject(params, function (err, data) {
		if (err) {
	    	console.log("Error uploading image: ", err);
	    	callback(err, null)
	    } else {
	    	console.log("Successfully uploaded image on S3", data);
	    	callback(null, data)
	    }
	})
}

exports.getgroupinfo=(req,res,next)=>{
 var groupId=req.body.groupId;
 var sessionval=req.body.session;

 async.series([
        function(callback)
        {
         mysql.GetGroupMembersStr(groupId,function(array)
          {
            callback(null,array);
          })
        }
       ,function(callback)
       {
        mysql.GetAdmin(groupId,function(admin)
        {
          callback(null,admin)
        })
       }], (err, result) => {


         console.log(result)


                           requestVar.post({url:'http://chikoop.com/api/index.php/celgram/check_contacts', form: {session:sessionval,contacts:result[0]}}, function(err,httpResponse,body)
                           { /* ... */

                               if(err) res.send(err);
                                  else
                                     {
                                     var data=JSON.parse(body)
                                     data['admin']=result[1];
                                      console.log(data);
                                       res.send(data);
                                     }

                            });



       });



}

exports.addmember=(req,res,next)=>{

  console.log(req.body);
  var obj={};
  var uniquegroupid=req.body.uniquegroupid;
  var users=req.body.users;
  obj.uniquegroupid=uniquegroupid;
  obj.users=users;
  mysql.AddBulkMembersToGroup(uniquegroupid,users,function(err,msg)
 {
  if(err)
  {
    res.send({status:false,message:msg});
  }else {
    res.send({status:true,message:msg});
  }
 })


}

exports.upload = (req, res, next) => {
	var tmp_path = req.files.file_name.path;
     console.log("item", req.files.file_name)
	var tmp_path = req.files.file_name.path;
	console.log(req.body.groupId);
	image = fs.createReadStream(tmp_path);
	var grID=req.body.groupId.toString();
	var senderID=req.body.sender_ID.toString();
    imageName = req.body.groupId+shortid.generate()+'.jpg';
    async.series([
        createMainBucket,
        createItemObject,
        function(callback)
        {
         mysql.GetGroupMembers(grID,function(array)
          {
            callback(null,array);
          })
        }
       ], (err, result) => {

      console.log(result);
       if(err) return res.send(err)
        else
        	{//socket call to changegrpdp

             var obj={ uniquegroupid: grID,
                       sender: senderID,
                       receivers:result[2],
                       nurl: imageName,
                       msgtype: 6 };

                       socket.emit('chgrdp',obj,function(data)
                                     {
                                     console.log("message id" ,data);
                                     if(data)
                                     {
                                     return res.send({
                                      status:true,
                                      message:"Notification send with id "+data,
                                      imgname:imageName
                                      });
                                     }   else
                                        {
                                             return res.send({
                                               status:false,
                                               message:"error uploading or Notification sending",});


                                        }
                                   });








                   return true;
        		//return res.json({message: "Successfully uploaded"})
            }


    });
}

exports.checkuser=(req,res)=>{
  var user_id=req.body.user_id;
  db.checkUser(user_id,function(err,result){
    if(!err)
    {
      console.log(err);
      res.send({
        status:false,
        message:"User Already Exist",
        data:result[0].session
      });
    }else {
      res.send(
        {
          status:true,
          message:"User is not Registered"
        })
    }
  })
}

exports.alertuser=(req,res)=>{
  var user_id=req.body.user_id;
  var session=req.body.session;
  var newsession=req.body.new_session;
  var object={};
  object.sender=objadmin.username+objadmin.session;
  object.receiver=user_id+session;
  object.data="Device has been Revoked by other Android Device";
  object.isfirstmsg=true;
  object.needack=true;
  object.msg_type=403;
  object.newsession=newsession;

  socket.emit("sendpmmsg2",object,function(msgid)
  {
    res.send({status:true,message:"Successfully Alerted User",data:msgid});
  })

  /*object.put("sender", socket_id);
                object.put("receiver", message.getConvo_partner());
                object.put("data", message.getData());
                object.put("isfirstmsg", true);
                object.put("needack", true);
                object.put("msg_type", message.getMsg_type());*/

}

exports.updatesession=(req,res)=>{
  var user_id=req.body.user_id;
  var session=req.body.session;
  var object={};
  object.user_id=user_id;
  object.session=session;
  socket.emit("setsession",object,function(success)
  {
    if(success){
    res.send({status:true,message:"Successfully Added Session",data:session});
  }
  })
}

exports.registeruser=(req,res)=>{
  var user_id=req.body.user_id;
  var username=req.body.username;
  var firstname=req.body.firstname;
  var lastname=req.body.lastname;
  var session=req.body.session;
  if(req.files.file_name==null)
  {
    //without dp upload
    db.checkUser(user_id,function(err,result)
    {
    if(!err)
    {
      console.log(err);
        //User Already Exist update the tables
     async.series([
      function(callback){
        db.updateusers(user_id,firstname,lastname,"default.jpg",username,session,function(err,message,result)
       {
         callback(err,result,message)
       })
     },
     function(callback){
       db.checkUser(user_id,function(err,result){
         callback(err,result)
       })
     }

    ],(err,result)=>{
      console.log(result[1]);
      if(err)
      {res.send({status:false,result:[]})}
      else {
        res.send({status:true,result:result[1][0]})
      }

      });


   }
    else {
      async.series([
       function(callback){
         db.insertuser(user_id,username,firstname,lastname,"default.jpg",session,function(err,result,fields)
        {
          callback(err,result,fields)
        })
      },
      function(callback){
        db.checkUser(user_id,function(err,result){
          callback(err,result)
        })
      }

     ],(err,result)=>{
       console.log(result[1]);
       if(err)
       {res.send({status:false,result:[]})}
       else {
         res.send({status:true,result:result[1][0]})
       }

       });

    }
});


  }else {

    var tmp_path = req.files.file_name.path;
    console.log("item", req.files.file_name)
    image = fs.createReadStream(tmp_path);
    imageName = user_id+shortid.generate()+'.jpg';

    db.checkUser(user_id,function(err,result)
    {
    if(!err)
    {
      console.log(err);
        //User Already Exist update the tables
        async.series([createMainBucket,
              function(callback){
                createItemObjectModified(imageName,image,function(err,result)
              {
                callback(err,result);
              })
            },
            function(callback){
              db.updateusers(user_id,firstname,lastname,imageName,username,session,function(err,message,result)
             {
               callback(err,result,message)
             })
           },
           function(callback){
             db.checkUser(user_id,function(err,result){
               callback(err,result)
             })
           }

          ],(err,result)=>{
            console.log(result[3]);
            if(err)
            {res.send({status:false,result:[]})}
            else {
              res.send({status:true,result:result[3][0]})
            }

            });
          }

    else {
      async.series([createMainBucket,
            function(callback){
              createItemObjectModified(imageName,image,function(err,result)
            {
              callback(err,result);
            })
          },
          function(callback){
             db.insertuser(user_id,username,firstname,lastname,imageName,session,function(err,result,fields)
           {
             callback(err,result,fields)
           })
         },
         function(callback){
           db.checkUser(user_id,function(err,result){
             callback(err,result)
           })
         }

        ],(err,result)=>{
          console.log(result[3]);
          if(err)
          {res.send({status:false,result:[]})}
          else {
            res.send({status:true,result:result[3][0]})
          }

          });
        }
      });

    }

}


exports.profilepicture=(req,res)=>{
  var user_id=req.body.user_id;
  var tmp_path = req.files.file_name.path;
  console.log("item", req.files.file_name)
  image = fs.createReadStream(tmp_path);
  imageName = user_id+shortid.generate()+'.jpg';
  async.series([createMainBucket,
        function(callback){
          createItemObjectModified(imageName,image,function(err,result)
        {
          callback(err,result);
        })
      },
      function(callback){
        db.updatePicture(user_id,imageName,function(err,message,result)
       {
         callback(err,result,message)
       })
     },
     function(callback){
       db.checkUser(user_id,function(err,result){
         callback(err,result)
       })
     }

    ],(err,result)=>{
      console.log(result[3]);
      if(err)
      {res.send({status:false,result:[]})}
      else {
        res.send({status:true,result:result[3][0]})
      }

      });

}

exports.updateusername=(req,res)=>
{
  var user_id=req.body.user_id;
  var username=req.body.username;
  db.updateusername(user_id,username,function(err,message,results){
    if(!err)
    {
      res.send({
        status:true,
        message:message
      })
    }else {
      res.send({
        status:false,
        message:message
      })
    }
  })
}

exports.updatestatus=(req,res)=>
{
  var user_id=req.body.user_id;
  var userstatus=req.body.status;
  db.updatestatus(user_id,userstatus,function(err,message,results){
    if(!err)
    {
      res.send({
        status:true,
        message:message
      })
    }else {
      res.send({
        status:false,
        message:message
      })
    }
  })
}

exports.checkcontacts=(req,res)=>{
var listcontacts=req.body.contacts;
db.checkcontacts(listcontacts,function(err,results)
{
  if(err)
  {
    res.send({status:false,message:"Error Occurred"});
  }else{
       res.send({status:true,result:results})
  }
})
}

//user_id,username,firstname,lastname,imageName,session

exports.displayForm = (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    res.write(
        '<form action="/registeruser" method="post" enctype="multipart/form-data">' +
        '<input type="text" name="user_id" value="7055743169">' +
        '<input type="text" name="username" value="rohan7055">' +
        '<input type="text" name="firstname" value="Rohan">' +
        '<input type="text" name="lastname" value="Thakur">' +
        '<input type="text" name="session" value="xavsgdahuysas">' +
        '<input type="file" name="file_name">' +
        '<input type="submit" value="Upload">' +
        '</form>'
    );
    res.end();
};
