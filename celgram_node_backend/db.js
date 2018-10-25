var exports = module.exports = {};

var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 100, //important
  host     : 'localhost',
  user     : 'root',
  password : 'abc12345',
  database : 'chikoop_celgram'
});
var moment=require('moment');

insertuser=function(user_id,username,firstname,lastname,imgname,session,callback)
{
var query="insert users (user_id,username,firstname,lastname,imgname,session,created_at) values (?,?,?,?,?,?,?)";
queryArray=[user_id,username,firstname,lastname,imgname,session,moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss')];

pool.getConnection(function(error,connection){
  if(error){
    callback(true,null,"Pool Connection Error Occurred");
  }
  else{
    connection.query(query,queryArray,
                            function(error,result,fields){
                              connection.release();
                              if(error){
                                console.log(error);
                                callback(true,"Query Error Occured",null);
                              }
                              else{
                                callback(false,"Patient Registered Successfully",fields);
                              }
                            });
       }
});


}

updateusers=function(user_id,firstname,lastname,imgname,username,session,callback)
{
  var query="update users set firstname=?,lastname=?,imgname=?,username=?,session=? where user_id=?";
  var queryArray=[firstname,lastname,imgname,username,session,user_id];
  pool.getConnection(function(error,connection){
    if(error)
    {
      callback(true,"Pool Connection Error Occurred",null);
    }
    else{
      connection.query(query,queryArray,
        function(error,result,fields){
          connection.release();
          if(error){
            console.log(error);
            callback(true,"Query Error Occured",null);
          }else{
            callback(false,"Updated successfully",fields);
          }
        })
    }
  })
}

updatePicture=function(user_id,imgname,callback)
{
  var query="update users set imgname=? where user_id=?";
  var queryArray=[imgname,user_id];
  pool.getConnection(function(error,connection){
    if(error)
    {
      callback(true,"Pool Connection Error Occurred",null);
    }
    else{
      connection.query(query,queryArray,
        function(error,result,fields){
          connection.release();
          if(error){
            console.log(error);
            callback(true,"Query Error Occured",null);
          }else{
            callback(false,"Updated successfully",fields);
          }
        })
    }
  })
}


updateusername=function(user_id,username,callback)
{
  var query="update users set username=? where user_id=?";
  var queryArray=[username,user_id];
  pool.getConnection(function(error,connection){
    if(error)
    {
      callback(true,"Pool Connection Error Occurred",null);
    }
    else{
      connection.query(query,queryArray,
        function(error,result,fields){
          connection.release();
          if(error){
            console.log(error);
            callback(true,"Query Error Occured",null);
          }else{
            callback(false,"Updated successfully",fields);
          }
        })
    }
  })
}


updatestatus=function(user_id,status,callback)
{
  var query="update users set status=? where user_id=?";
  var queryArray=[status,user_id];
  pool.getConnection(function(error,connection){
    if(error)
    {
      callback(true,"Pool Connection Error Occurred",null);
    }
    else{
      connection.query(query,queryArray,
        function(error,result,fields){
          connection.release();
          if(error){
            console.log(error);
            callback(true,"Query Error Occured",null);
          }else{
            callback(false,"Updated successfully",fields);
          }
        })
    }
  })
}


insertdoctor=function(name,username,password,phone,email,address,callback)
{
  var query="insert doctor (name,username,password,phone,email,address) values (?,?,?,?,?,?)";
  var queryArray=[name,username,password,phone,email,address];

  pool.getConnection(function(error,connection){
    if(error){
      callback(true,null,"Pool Connection Error Occurred");
    }
    else{
      connection.query(query,queryArray,
                              function(error,result,fields){
                                connection.release();
                                if(error){
                                  console.log(error);
                                  callback(true,"Query Error Occured",null);
                                }
                                else{
                                  callback(false,"Doctor Registered Successfully",fields);
                                }
                              });
         }
  });
}

checkUser=function(user_id,callback)
{

var query="select * from users where user_id=?";
var queryArray=[user_id];
pool.getConnection(function(err,connection)
{
 connection.query(query,queryArray,function(error,results,field)
{
 connection.release();

if(error)
{
  console.log(error);
  callback(true,error.message)
}
else {
      console.log(results);
      if(results.length>0)
      {
        callback(false,results);
      }
      else {
        callback(true,"No User Exists");
      }
    }
});

})

}

checkcontacts=function(contacts,callback){
  var query="select user_id,username,firstname,lastname,status,imgname,db_update_time from users where user_id in (?)";
  var queryArray=contacts.split(',');
  pool.getConnection(function(err,connection)
  {
   connection.query(query,[queryArray],function(error,results,field)
  {
   connection.release();

  if(error)
  {
    console.log(error);
    callback(true,null)
  }
  else {
        console.log(results);
        if(results.length>0)
        {
          callback(false,results);
        }
        else {
          callback(true,null);
        }
      }
  });

  })

}

getDoctor=function(username,callback)
{

var query="select * from doctor where username=?";
var queryArray=[username];
pool.getConnection(function(err,connection)
{
 connection.query(query,queryArray,function(error,results,field)
{
 connection.release();

if(error)
{
  console.log(error);
  callback(true,null)
}
else {
      console.log(results);
      if(results.length>0)
      {
        callback(false,results);
      }
      else {
        callback(true,null);
      }
    }
});

})

}


getDoctorByContact=function(contact,callback)
{

var query="select * from doctor where phone=?";
var queryArray=[contact];
pool.getConnection(function(err,connection)
{
 connection.query(query,queryArray,function(error,results,field)
{
 connection.release();

if(error)
{
  console.log(error);
  callback(true,null)
}
else {
      console.log(results);
      if(results.length>0)
      {
        callback(false,results);
      }
      else {
        callback(true,"Please Enter a Valid Doctor Contact");
      }
    }
});

})

}


getPatientInfo=function(username,callback)
{
  var query="select patient.*,doctor.name,doctor.phone,doctor.email from patient join doctor on patient.doctor_id=doctor.doctor_id where patient.username=?";
  var queryArray=[username];

  pool.getConnection(function(err,connection)
  {
   connection.query(query,queryArray,function(error,results,field)
  {
   connection.release();

  if(error)
  {
    console.log(error);
    callback(true,null)
  }
  else {
        console.log(results);
        if(results.length>0)
        {
          callback(false,results);
        }
        else {
          callback(true,null);
        }
      }
  });

});

}


getDoctorInfo=function(username,callback)
{
//  var query="select patient.*,doctor.name,doctor.phone,doctor.email from patient join doctor on patient.doctor_id=doctor.doctor_id where patient.username=?";

 var query="select doctor.*,patient.fullname,patient.phone,patient.address from doctor join patient on doctor.doctor_id=patient.doctor_id where doctor.username=?"
  var queryArray=[username];

  pool.getConnection(function(err,connection)
  {
   connection.query(query,queryArray,function(error,results,field)
  {
   connection.release();

  if(error)
  {
    console.log(error);
    callback(true,null)
  }
  else {
        console.log(results);
        if(results.length>0)
        {
          callback(false,results);
        }
        else {
          callback(true,null);
        }
      }
  });

});

}


exports.insertuser = insertuser;
exports.insertdoctor = insertdoctor;
exports.checkUser=checkUser;
exports.checkcontacts=checkcontacts;
exports.getDoctorByContact=getDoctorByContact;
exports.getPatientInfo=getPatientInfo;
exports.getDoctorInfo=getDoctorInfo;
exports.updateusers=updateusers;
exports.updatePicture=updatePicture;
exports.updateusername=updateusername;
exports.updatestatus=updatestatus;
