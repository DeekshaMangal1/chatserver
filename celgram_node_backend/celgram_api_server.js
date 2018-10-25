var express=require('express');
var app=express();
// var bodyParser = require('body-parser');
var shortid = require('shortid');
var server=require('http').createServer(app);
const Upload = require('./controller')
const multipart = require('connect-multiparty')
const multipartMiddleware = multipart();
const bodyParser=require('body-parser');
const mysql=require('../utils');






//server.listen(process.env.PORT || 3000,'127.0.0.1');
server.listen(4000, ()=> {
    console.log ("api server running .....");
console.log("Visit localhost:4000");

});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', Upload.displayForm)
app.post('/upload', multipartMiddleware, Upload.upload)
app.post('/getgroupinfo',Upload.getgroupinfo)
app.post('/addmember',Upload.addmember)
app.post('/registeruser',multipartMiddleware,Upload.registeruser)
app.post('/checkcontacts',Upload.checkcontacts)
app.post('/checkuser',Upload.checkuser)
app.post('/alertuser',Upload.alertuser)
app.post('/uploadprofile',multipartMiddleware,Upload.profilepicture)
app.post('/updateusername',Upload.updateusername)
app.post('/updatestatus',Upload.updatestatus)
app.post('/updatesession',Upload.updatesession)
