'use strict';

/**
 * Module dependencies.
 */

var amqp = require('amqplib/callback_api'),
    amqpConn = null,
  config = require('../config'),
  path = require('path');

let channel = null;

var q = 'ontap_provision';

var bail = function(err) {
    console.error(err);
    process.exit(1);
}

var publisheToQueue = function(message) {
    amqpConn.createChannel(on_open);
    function on_open(err, ch) {
      channel = ch;
      if (err != null) closeOnErr(err);
      channel.assertQueue(q);
      var options = {
          headers: {
              "content-type":"application/json"
          }
      }
      channel.sendToQueue(q, Buffer.from(JSON.stringify(message)));
    }
}

// Consumer
var consumer = function() {
    var ok = amqpConn.createChannel(on_open);
    function on_open(err, ch) {
      if (err != null) bail(err);
      ch.assertQueue(q);
      ch.consume(q, function(msg) {
        if (msg !== null) {
          console.log(msg.content.toString());
          ch.ack(msg);
        }
      });
    }
  }

var start = function() {
    const opt = { credentials: require('amqplib').credentials.plain(config.rabitmq.user, config.rabitmq.password) };
    console.log(opt);
    amqp.connect(config.rabitmq.host + "?heartbeat=60", function(err, conn) {
        if (err) {
            console.error("[AMQP]", err.message);
            return setTimeout(start, 1000);
        }
        conn.on("error", function(err) {
            console.log("in error", err)
            if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error", err.message);
            }
        });
        conn.on("close", function() {
            console.error("[AMQP] reconnecting");
            return setTimeout(start, 1000);
        });
        console.log("[AMQP] connected");
        amqpConn = conn;
        // console.log(amqpConn)
        whenConnected();
    });
}

var whenConnected = function() {
   console.log("after connection is made")
}

exports.start = start;
exports.publisheToQueue = publisheToQueue;
exports.connection = amqpConn


