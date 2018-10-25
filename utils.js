/**
 * Created by sachin on 1/9/16.
 */

var exports = module.exports = {};
var Set = require("collections/set");
var mysql=require('mysql');
var http = require('https');

// var connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'chikoop_celgram8',
//     password : 'newcelgramuser',
//     database : 'chikoop_celgram'
// });

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'abc12345',
    database : 'chikoop_celgram'
});


// var connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'root',
//     password : 'sachin9922',
//     database : 'chat'
// });

connection.connect(function (err) {
    if (err){
        console.log('error connecting :'+ err.stack);
        return;
    }
    console.log('connected as id '+connection.threadId);
});

exports.my_connect=connection;


/**
 *
 * Creating tables for original chat database
 */

exports.create_table_messages=function() {

    var sql_query="create table messages (sender_receiver text,message_no integer,sender text,message text,timestamp datetime)";

    connection.query(sql_query,function (err, result) {
        if (err) throw  err;
        // console.log(jsDump.parse(result));
        console.log('Table messages created');
    });
};

// create_table_messages();


exports.create_table_total_messages=function() {

    var sql_query = "create table total_messages (sender_receiver varchar(50) primary key,message_count integer)";

    connection.query(sql_query, function (err, result) {
        if (err) throw  err;
        // console.log(jsDump.parse(result));
        console.log('Table total_messages created');
    });
};

// create_table_total_messages();


exports.create_table_users=function(){
//Create table users
    var sql_query = "create table users (user_id varchar(30) primary key,user_name varchar(20),status text,imgname text,groups_sub text ,created_at datetime)";

    connection.query(sql_query, function (err, result) {
        if (err) throw  err;
        // console.log(jsDump.parse(result));
        // console.log(JSON.stringify(result));
        console.log('Table users created');
    });
};

// create_table_users();
//

exports.create_table_group=function() {
//Create table group
    var sql_query = "create table groups (group_id varchar(30) primary key,group_name text,gr_dp_url text,groups_members text ,admin text,created_at datetime,deleted boolean default false)";

    connection.query(sql_query, function (err, result) {
        if (err) throw  err;
        // console.log(jsDump.parse(result));
        console.log('Table groups created');
    });
};

// create_table_group();

/**
 *
 * Creating Indexes On Tables
 *
 */


exports.create_index_on_messages=function() {

    var sql_query="create index messages_index on messages (sender_receiver(40))";

    connection.query(sql_query,function (err, result) {
        if (err) throw  err;
        // console.log(jsDump.parse(result));
        // console.log(JSON.stringify(result));
        console.log('Index on table messages created');
    });
};

// create_index_on_messages();

// function create_index_on_total_messages() {
//
//     var sql_query = "create index total_messages_index on total_messages (sender_receiver(40))";
//
//     connection.query(sql_query, function (err, result) {
//         if (err) throw  err;
//         // console.log(jsDump.parse(result));
//         // console.log(JSON.stringify(result));
//         console.log('Index on table total_messages created');
//     });
// }

// create_index_on_total_messages();

// function create_index_on_users() {
// //Create table users
//     var sql_query = "create index users_index on users (user_id (30))";
//
//     connection.query(sql_query, function (err, result) {
//         if (err) throw  err;
//         // console.log(jsDump.parse(result));
//         // console.log(JSON.stringify(result));
//         console.log('Index on table users created');
//     });
// }

// create_index_on_users();

// function create_index_on_group() {
// //Create table group
//     var sql_query = "create index groups_index on groups (group_id(30))";
//
//     connection.query(sql_query, function (err, result) {
//         if (err) throw  err;
//         // console.log(jsDump.parse(result));
//         // console.log(JSON.stringify(result));
//         console.log('Index on groups created');
//     });
// }

// create_index_on_group();


/**
 *
 * Inserting data into users
 */


exports.InsertIntoUsers=function(userid) {

    var sql_query = "insert ignore into users (user_id ,created_at) values (?,NOW())";

    connection.query(sql_query,[userid],function (err, result) {
        if (err) throw  err;
        // console.log(jsDump.parse(result));
        // console.log(JSON.stringify(result));
        console.log('data inserted in users');
    });
};

// InsertIntoUsers('sandubhai','15march1936');


exports.AddUserConnection=function(user_id,user_connection_id) {

    var sql_query = "select user_connections from users where user_id=?";

    connection.query(sql_query,[user_id],function (err, rows,fields) {
        if (err) throw  err;
        var str=rows[0].user_connections;
        if (str==null){
            str=user_connection_id;
            sql_query="update users set user_connections=? where user_id=?";
            connection.query(sql_query,[str,user_id],function (err,result) {
                if (err) throw  err;
                // console.log(jsDump.parse(result));
                // console.log(JSON.stringify(result));
                console.log('Added user connection');
            });

        }else{
            if (str.includes(user_connection_id)){

                console.log('already contains value');
            }else{

                str+=','+user_connection_id;
                sql_query="update users set user_connections=? where user_id=?";
                connection.query(sql_query,[str,user_id],function (err,result) {
                    if (err) throw  err;
                    // console.log(jsDump.parse(result));
                    // console.log(JSON.stringify(result));
                    console.log('Added user connection');

                });
            }
        }
        // console.log(JSON.stringify(result));
        // console.log('data inserted in users');
    });
};

// AddUserConnection("asdfdssssaddd","diva");

exports.AddGroupSubsribed=function(user_id, group_subscribed_id) {

    var sql_query = "select groups_sub from users where user_id=?";

    connection.query(sql_query,[user_id],function (err, rows,fields) {
        if (err) throw  err;
        var str=rows[0].groups_sub;
       //rohan 23/12/17
        console.log(user_id+': %s',str);
        if (str==null || str==""){
            // str=group_subscribed_id;
            var set=new Set([group_subscribed_id]);
            sql_query="update users set groups_sub=? where user_id=?";
            connection.query(sql_query,[set.toArray().toString(),user_id],function (err,result) {
                if (err) throw  err;
                // console.log(jsDump.parse(result));
                // console.log(JSON.stringify(result));
                console.log('Added group subscibed to user');
            });

        }else{
            console.log("second function got called");
            var set=new Set(str.split(','));
            set.add(group_subscribed_id);
                // str+=','+group_subscribed_id;
                sql_query="update users set groups_sub=? where user_id=?";
                connection.query(sql_query,[set.toArray().toString(),user_id],function (err,result) {
                    if (err) throw  err;
                    // console.log(jsDump.parse(result));
                    // console.log(JSON.stringify(result));
                    console.log('Added group subscibed');
                });
        }
        // console.log(JSON.stringify(result));
        // console.log('data inserted in users');
    });

};

exports.RemoveGroupSubsribed=function(user_id, group_subscribed_id) {

    var sql_query = "select groups_sub from users where user_id=?";

    connection.query(sql_query,[user_id],function (err, rows,fields) {
        if (err) throw  err;
        var str=rows[0].groups_sub;
        if (str==null || str==""){

        }else{
            console.log("second function got called");
            var set=new Set(str.split(','));
            set.delete(group_subscribed_id);
            // str+=','+group_subscribed_id;
            sql_query="update users set groups_sub=? where user_id=?";
            connection.query(sql_query,[set.toArray().toString(),user_id],function (err,result) {
                if (err) throw  err;
                // console.log(jsDump.parse(result));
                // console.log(JSON.stringify(result));
                console.log('Removed group subscibed');
            });
        }
        // console.log(JSON.stringify(result));
        // console.log('data inserted in users');
    });

};

// AddGroupSubsribed("asdfdssssaddd","diva16");

exports.GetUserInfo=function(user_id,callback) {
    var sql_query = "select * from users where user_id=?";

    connection.query(sql_query,[user_id],function (err, rows,fields) {
        if (err) throw  err;
        // console.log(jsDump.parse(rows));
        // console.log(JSON.stringify(result));
        // console.log('data inserted in users');
        callback(rows[0]);
    });
};
// GetUserInfo("asdfdssssaddd");


exports.GetGroupInfo=function(group_id,callback){

    var query="select group_id,group_name,gr_dp_url,groups_members,admin,DATE_FORMAT(created_at,'%Y-%m-%d %T')as created_at,deleted from groups where group_id=?";

    connection.query(query,[group_id],function (err, rows, fields) {
        if (err) throw  err;
        // console.log(jsDump.parse(rows));
        // console.log(JSON.stringify(result));
        // console.log('data inserted in users');
        callback(rows[0]);
    });
};


/**
 * Inserting data into total_messages
 *
 */

exports.InsertIntototalmessages=function(userid) {
    var sql_query = "insert into total_messages values (?,?) ON DUPLICATE KEY UPDATE message_count = message_count + 1";

    connection.query(sql_query,[userid,1],function (err, result) {
        if (err) throw  err;
        // console.log(jsDump.parse(result));
        // console.log(JSON.stringify(result));
        console.log('data inserted in total_messages');
    });

};


// InsertIntototalmessages('aniket');

exports.GetTotalMessages=function(userid,callback) {

    var sql_query = "select * from total_messages where sender_receiver=?";

    connection.query(sql_query,[userid],function (err, rows,fields) {
        if (err) throw  err;
        // console.log(jsDump.parse(rows[0].message_count));
        // console.log(JSON.stringify(result));
        // console.log('data inserted in users');
        if (rows.length==0){
            callback(0);
            console.log('length is zero')
        }else {
            callback(rows[0].message_count);
            console.log('length is not zero');
        }
    });
};
// GetTotalMessages('sachin');

/**
 *
 * Insert into messages
 *
 */

exports.InsertIntomessages=function(userid,message_no,sender,message) {

    var sql_query = "insert into messages (sender_receiver,message_no,sender,message,timestamp) values (?,?,?,?,NOW())";

    connection.query(sql_query,[userid,message_no,sender,message],function (err, result) {
        if (err) throw  err;
        // console.log(jsDump.parse(result));
        // console.log(JSON.stringify(result));
        console.log('data inserted in messages');
    });

};

// InsertIntomessages("lelele",7,"admin","Hi dudies","wdqwd");

exports.GetMessages=function(user_id,message_no_threshold,callback) {

    var sql_query = "select * from messages where sender_receiver=? and message_no >?";

    connection.query(sql_query,[user_id,message_no_threshold],function (err, rows,fields) {
        if (err) throw  err;
        // console.log(jsDump.parse(rows));
        // console.log(JSON.stringify(rows));
        // console.log('data inserted in users');
        callback(rows);

    });
};

// GetMessages("lelele",1);

/**
 *
 * Insert into group
 */

exports.InsertIntoGroups=function(group_id, group_name,admin) {

    var sql_query = "insert ignore into groups (group_id,group_name,groups_members,created_at,admin) values (?,?,?,NOW(),?)";

    connection.query(sql_query,[group_id,group_name,admin,admin],function (err, result) {
        if (err) throw  err;
        // console.log(jsDump.parse(result));
        // console.log(JSON.stringify(result));
        console.log('data inserted into groups');
    });

};

// InsertIntoGroups('sanduid','BE10','16aug12012','sachin');


exports.AddBulkMembersToGroup=function(group_id,users,callback)
{
  var sql_query="select groups_members from groups where group_id=?";
  connection.query(sql_query,[group_id],function(err,rows,fields)
{
  if(err) throw err;
  sql_query="update groups set groups_members=? where group_id=?"
  connection.query(sql_query,[users.toString(),group_id],function(err,result)
     {
       if(err)
       {
         callback(true,err);
       }
       else {
         console.log('bulkmember added to group');
         callback(false,"Successfully Bulk Updated");
       }

     });
});
}

exports.AddMemberToGroup=function(group_id, group_member_id) {

    var sql_query = "select groups_members from groups where group_id=?";

    connection.query(sql_query,[group_id],function (err, rows,fields) {
        if (err) throw  err;
        var str=rows[0].groups_members;
        if (str==null || str==""){
            // str=group_member_id;
            var set=new Set([group_member_id]);
            sql_query="update groups set groups_members=? where group_id=?";
            connection.query(sql_query,[set.toArray().toString(),group_id],function (err,result) {
                if (err) throw  err;
                // console.log(jsDump.parse(result));
                // console.log(JSON.stringify(result));
                console.log('member added to group');
            });

        }else{
                // str+=','+group_member_id;
            var set=new Set(str.split(','));
            set.add(group_member_id);
                sql_query="update groups set groups_members=? where group_id=?";
                connection.query(sql_query,[set.toArray().toString(),group_id],function (err,result) {
                    if (err) throw  err;
                    // console.log(jsDump.parse(result));
                    // console.log(JSON.stringify(result));
                    console.log('member added to group');
                });
        }
        // console.log(JSON.stringify(result));
        // console.log('data inserted in users');
    });

};

// AddMemberToGroup('thsi_is_id','sac1');

exports.RemoveMemberFromGroup=function(group_id, removed_member_id) {

    //
    // var sql_query = "select removed_members from groups where group_id=?";
    //
    // connection.query(sql_query,[group_id],function (err, rows,fields) {
    //     if (err) throw  err;
    //     var str=rows[0].removed_members;
    //     if (str==null){
    //         str=removed_member_id;
    //         sql_query="update groups set removed_members=? where group_id=?";
    //         connection.query(sql_query,[str,group_id],function (err,result) {
    //             if (err) throw  err;
    //             // console.log(jsDump.parse(result));
    //             // console.log(JSON.stringify(result));
    //             console.log('member removed from group');
    //         });
    //
    //     }else{
    //         if (str.includes(removed_member_id)){
    //
    //             console.log('already contains value');
    //         }else{
    //
    //             str+=','+removed_member_id;
    //             sql_query="update groups set removed_members=? where group_id=?";
    //             connection.query(sql_query,[str,group_id],function (err,result) {
    //                 if (err) throw  err;
    //                 // console.log(jsDump.parse(result));
    //                 // console.log(JSON.stringify(result));
    //                 console.log('member removed from group');
    //
    //                 // console.log('data inserted in users');
    //             });
    //         }
    //     }
    //     // console.log(JSON.stringify(result));
    //     // console.log('data inserted in users');
    // });

    var sql_query = "select groups_members from groups where group_id=?";

    connection.query(sql_query,[group_id],function (err, rows,fields) {
        if (err) throw  err;
        var str=rows[0].groups_members;
        if (str==null || str==""){

        }else{
            // str+=','+group_member_id;
            var set=new Set(str.split(','));
            set.delete(removed_member_id);
            sql_query="update groups set groups_members=? where group_id=?";
            connection.query(sql_query,[set.toArray().toString(),group_id],function (err,result) {
                if (err) throw  err;
                // console.log(jsDump.parse(result));
                // console.log(JSON.stringify(result));
                console.log('member deleted from group');
            });
        }
        // console.log(JSON.stringify(result));
        // console.log('data inserted in users');
    });


};

// RemoveMemberFromGroup('thsi_is_id','sachin');

exports.GetGroupMemberInfo=function(group_id,callback) {

    var sql_query = "select groups_members from groups where group_id=?";

    connection.query(sql_query,[group_id],function (err, rows,fields) {
        if (err) throw  err;
        // console.log(jsDump.parse(rows[0]));
        // console.log(JSON.stringify(result));`
        // console.log('data inserted in users');
        var array=rows[0].groups_members.split(',');
        var str="";
        var i=0;
        for (i=0;i<array.length-1;i++){
            str+="'"+array[i]+"',";
        }
        str+="'"+array[i]+"'";
        var query="select * from users where user_id in ("+str+")";

        connection.query(query,function (err, rows, fields) {
            callback(rows);
        });
    });

};
exports.GetGroupMembers=function(group_id,callback)
{
        var sql_query = "select groups_members from groups where group_id=?";
         connection.query(sql_query,[group_id],function (err, rows,fields) {
        if (err) throw  err;
        // console.log(jsDump.parse(rows[0]));
        // console.log(JSON.stringify(result));`
        // console.log('data inserted in users');
        var array=rows[0].groups_members.split(',');
        callback(array);

    });
 }
  exports.GetGroupLastAddedMemeber=function(group_id,callback)
   {
        var sql_query = "select groups_members from groups where group_id=?";
         connection.query(sql_query,[group_id],function (err, rows,fields) {
        if (err) throw  err;
        // console.log(jsDump.parse(rows[0]));
        // console.log(JSON.stringify(result));`
        // console.log('data inserted in users');
        var array=rows[0].groups_members.split(',');
        callback(array[array.length-1]);

    });

     }

exports.GetGroupMembersStr=function(group_id,callback)
{
        var sql_query = "select groups_members from groups where group_id=?";
         connection.query(sql_query,[group_id],function (err, rows,fields) {
        if (err) throw  err;
        // console.log(jsDump.parse(rows[0]));
        // console.log(JSON.stringify(result));`
        // console.log('data inserted in users');
       // var array=rows[0].groups_members.split(',');
        callback(rows[0].groups_members);

    });

}

exports.GetUserGroupInfo=function (user_id, callback) {

    var sql_query = "select groups_sub from users where user_id=?";

    connection.query(sql_query,[user_id],function (err, rows,fields) {
        if (err) throw  err;

        // console.log('Groups are',rows[0].groups_sub);

        var array=rows[0].groups_sub.split(',');
        var str="";
        var i=0;
        for (i=0;i<array.length-1;i++){
            str+="'"+array[i]+"',";
        }
        str+="'"+array[i]+"'";
        var query="select * from groups where group_id in ("+str+")";

        connection.query(query,function (err, rows, fields) {
            callback(rows);
        });

    });
};

exports.ChangeMyStatus=function (user_id,new_status) {
    var query="update users set status=? where user_id=?";
    connection.query(query,[new_status,user_id],function (err, result) {
        if (err) throw  err;
    });
};

exports.ChangeMyName=function (user_id, new_name) {
    var query="update users set user_name=? where user_id=?";
    connection.query(query,[new_name,user_id],function (err, result) {
        if (err) throw  err;
    });
};

exports.ChangeMyDp=function (user_id, new_photo_url) {
    var query="update users set imgname=? where user_id=?";
    connection.query(query,[new_photo_url,user_id],function (err, result) {
        if (err) throw  err;
    });
};

exports.ChangeGroupName=function (group_id, new_name) {
    var query="update groups set group_name=? where group_id=?";
    connection.query(query,[new_name,group_id],function (err, result) {
        if (err) throw  err;
    });
};

exports.ChangeGroupdp=function (group_id, new_photo_url) {
    var query="update groups set gr_dp_url=? where group_id=?";
    connection.query(query,[new_photo_url,group_id],function (err, result) {
        if (err) throw  err;
    });
};

exports.SetGroupDeleted=function (group_id) {
    var query="update groups set deleted=? where group_id=?";
    connection.query(query,[true,group_id],function (err, result) {
        if (err) throw  err;
    });
};


exports.SetAdmin=function (group_id,name) {
    var query="update groups set admin=? where group_id=?";
    connection.query(query,[name,group_id],function (err, result) {
        if (err) throw  err;
        else
        {
            console.log("admin set ",name);
        }
    });
};

exports.GetAdmin=function(group_id,callback)
{
    var query="select admin from groups where group_id=?";
    connection.query(query,[group_id],function(err, rows,fields)
    {
        if(err) throw err;
       callback(rows[0].admin);
    })
}

// GetGroupInfo('sanduid');

// connection.end();
