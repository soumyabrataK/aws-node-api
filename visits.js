"use strict";

require("dotenv").config({ path: "secrets.json" });
const mongoose = require("mongoose"); // this code is used for connecting to mongoose db.
const connectToDB = require("./connectToDB");


let headers = {
  // headers let the client and the server pass additional information with an HTTP request or response.
  "Access-Control-Allow-Origin": "*", // The Access-Control-Allow-Origin header included in the response from one website to a request originating from another website, and identifies the permitted origin of the request
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token", //??
  "Access-Control-Allow-Credentials": true, // ??
  "Content-Type": "application/json",
};

module.exports.api = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("endpoint hitted", event.pathParameters);
  switch (event.pathParameters.path) {
<<<<<<< HEAD
    case "visited-page":
      visitedPage(event, context, callback);
=======
    case "page-visited":
      createUpdateBlog(event, context, callback);
>>>>>>> 5ac6b33f174cdc6ec2631ebf874f1d01b236c0a4
      break;
  }
};