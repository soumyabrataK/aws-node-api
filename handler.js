"use strict";

require("dotenv").config({ path: "secrets.json" });
// already installed in code
const AWS = require("aws-sdk");
let mongoose = require("mongoose"); // this code is used for connecting to mongoose db.
let async = require("async"); // Async is a utility module which provides straight-forward, powerful functions for working with asynchronous JavaScript.
const path = require("path"); //This module provides path. sep which provides the path segment separator
const fs = require("fs"); // The fs module provides a lot of very useful functionality to access and interact with the file system
let jwt = require("jsonwebtoken"); // this module is a open standard used to share security information between two parties- client and server.
const crypto = require("crypto"); //The crypto module is mostly useful as a tool for implementing cryptographic protocols such as TLS and https.
const events = require("events"); // Node.js has an event-driven architecture which can perform asynchronous tasks.
let nodeMailer = require("nodemailer"); //Nodemailer is a module for Node.js applications to allow easy as cake email sending.
const connectToDB = require("./connectToDB");
const blogs = require("./collections/blogs");
const { clone } = require("./helper");
const moment = require("moment/moment");
const get_quote = require("./collections/get_quote");

let headers = {
  // headers let the client and the server pass additional information with an HTTP request or response.
  "Access-Control-Allow-Origin": "*", // The Access-Control-Allow-Origin header included in the response from one website to a request originating from another website, and identifies the permitted origin of the request
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token", //??
  "Access-Control-Allow-Credentials": true, // ??
  "Content-Type": "application/json",
};

function encrypt(text) {
  let cipher = crypto.createCipher("aes-256-ctr", process.env.passcode);
  let crypted = cipher.update(text, "utf8", "hex");
  crypted += cipher.final("hex");
  return crypted;
}

function decrypt(text) {
  let decipher = crypto.createDecipher(
    process.env.algorithm,
    process.env.passcode
  );
  let dec = decipher.update(text, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

module.exports.api = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("endpoint hitted", event.pathParameters);
  switch (event.pathParameters.path) {
    case "create-edit-blog":
      createUpdateBlog(event, context, callback);
      break;
    case "get-qoute":
      getQoute(event, context, callback);
      break;
  }
};

////////////////////////////////////////////////// Create Or Update BLog /////////////////////////////////////////
async function createUpdateBlog(event, context, callback) {
  try {
    /////////////////////////////// DB Connection ///////////////////////////////////
    await connectToDB();
    const { data } = JSON.parse(event.body);
    let response;

    ///////////////////////////// Data Modification for Creation or Updation /////////////////////////
    const updationData = clone(data);
    if (updationData._id) delete updationData._id;
    // console.log('data==========>', data, "<=====updationData=======>", updationData);

    ///////////////////////// DB Operation //////////////////////////////////////////////
    const existing = await blogs.findById(data._id, { _id: 1 });
    // console.log('existing=======>', existing);

    if (!existing) {
      ////////////////////////////////////////// Create Operation ///////////////////////////////////
      const createResponse = await blogs.create(updationData);
      // console.log('createResponse===>', createResponse)
      const { _id } = createResponse;
      if (_id) response = { operation: "create", _id: _id };
    } else {
      /////////////////////////////////////// Update Operation ////////////////////////////////////
      const updateResponese = await blogs.updateOne(
        { _id: mongoose.Types.ObjectId(data._id) },
        { $set: { ...updationData, updated_datetime: moment().valueOf() } }
      );
      // console.log('updateResponese==========>', updateResponese);
      const { acknowledged, modifiedCount, matchedCount } = updateResponese;
      if (acknowledged === true && matchedCount > 0 && modifiedCount > 0)
        response = { operation: "update", _id: data._id };
    }

    ////////////////////////// Error Response ///////////////////////////////////////////
    if (response === undefined)
      response = { operation: "failed", message: "Something Went Wrong" };

    ///////////////////////////////// Response Send /////////////////////////////////////////
    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: response,
      }),
    });
  } catch (error) {
    callback(null, {
      statusCode: error.statusCode || 500,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Connection problem" + String(error),
    });
  }
}

/////////////////////////////////////////// Get Qoute ///////////////////////////////////////
async function getQoute(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const req = JSON.parse(event.body);

    const registration = await createRegistration(req);
    if (registration.status === "error") throw new Error(registration.results);

    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        results: { _id: registration.results._id },
        message: "Successfully Registered",
      }),
    });
  } catch (error) {
    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "error",
        results: error,
      }),
    });
  }
}

/////////////////////////////////// Create Registration ////////////////////////////////////
function createRegistration(data) {
  return new Promise(async (resolve) => {
    try {
      await connectToDB();
      const dbResponse = await get_quote.create(data);
      if (!dbResponse._id)
        throw new Error("Registration Unsuccessful! Please try again");

      resolve({ status: "success", results: dbResponse });

      // console.log("dbResponse======>", dbResponse);
    } catch (err) {
      console.log("error======>", err);
      resolve({ status: "error", results: err });
    }
  });
}
