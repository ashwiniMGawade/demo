'use strict';

/**
 * Module dependencies.
 */

var amqp = require('amqplib/callback_api'),
    amqpConn = null,
  config = require('../config'),
  path = require('path');

var q = 'tasks';

var bail = function(err) {
    console.error(err);
    process.exit(1);
  }

var publisher = function() {
    amqpConn.createChannel(on_open);
    function on_open(err, ch) {
      if (err != null) closeOnErr(err);
      ch.assertQueue(q);
      ch.sendToQueue(q, Buffer.from('something to do'));
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
    publisher();
    // consumer(conn);
}

exports.start = start;
exports.publisher = publisher;


