/**
 * Created by sachin on 30/9/16.
 */

var amqp = require('amqplib/callback_api');
var exports = module.exports = {};

// var rabbitchannel;
// var exchange;
amqp.connect('amqp://localhost',function (err, conn) {
    
    exports.connection=conn;
    
    if (err){
        console.log('Error connecting server',err);
    }else{
        console.log('Successfully connected creating channel');
        conn.createChannel(function (err, ch) {
            
            var exchange='yoloexchange';
            ch.assertExchange(exchange,'direct',{durable: true});
            exports.exchange=exchange;

            //exchange for magic chat
            var exchangeMagic='magicExchange';
            ch.assertExchange(exchange,'direct',{durable: true});
            exports.exchangeMagic=exchangeMagic;
            // rabbitchannel=ch;
        });
    }
});

// exports.channel=rabbitchannel;
// exports.exchange=exchange;