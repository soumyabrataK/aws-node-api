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
const users = require("./collections/user-schema");
const loginschema = require("./collections/login-schema");
const portfolios = require("./collections/portfolio");
const { clone } = require("./helper");
const moment = require("moment/moment");
const get_quote = require("./collections/get_quote");
const portfolio = require("./collections/portfolio");
const services = require("./collections/services");

let headers = {
  // headers let the client and the server pass additional information with an HTTP request or response.
  "Access-Control-Allow-Origin": "*", // The Access-Control-Allow-Origin header included in the response from one website to a request originating from another website, and identifies the permitted origin of the request
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token", //??
  "Access-Control-Allow-Credentials": true, // ??
  "Content-Type": "application/json",
};

function encrypt(text) {
  console.log("text=========>", text);
  let cipher = crypto.createCipher("aes-256-ctr", process.env.PASS_CODE);
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
    case "blog-edit-data":
      blogEdit(event, context, callback);
      break;
    case "bloglisting":
      bloglisting(event, context, callback);
      break;
    case "bloglistingcount":
      bloglistingcount(event, context, callback);
      break;
    case "deletesingleblog":
      deleteSingleBlog(event, context, callback);
      break;
    case "createupdateportfolio":
      createUpdateportfolio(event, context, callback);
      break;
    case "portfoliolistingcount":
      portfoliolistingcount(event, context, callback);
      break;
    case "portfolio-edit-data":
      portfolioEdit(event, context, callback);
      break;
    case "portfoliolisting":
      portfoliolisting(event, context, callback);
      break;
    case "deletesingleportfolio":
      deleteSinglePortfolio(event, context, callback);
      break;
    case "create-edit-service":
      createUpdateService(event, context, callback);
      break;
    case "servicelisting":
      serviceListing(event, context, callback);
      break;
    case "servicelistingcount":
      serviceListingCount(event, context, callback);
      break;
    case "quotelisting":
      quoteListing(event, context, callback);
      break;
    case "quotelistingcount":
      quoteListingCount(event, context, callback);
      break;
    case "deletesingleservice":
      deleteSingleService(event, context, callback);
      break;
    case "fetch-service-categories":
      fetchServiceCategories(event, context, callback);
      break;
    case "fetch-portfolios-by-category":
      fetchPortfoliosByCategories(event, context, callback);
      break;
    case "fetch-blog-details":
      fetchBlogDetails(event, context, callback);
      break;
    case "fetch-blogs-by-category":
      fetchBlogsByCategories(event, context, callback);
      break;
    case "fetch-services":
      fetchServices(event, context, callback);
      break;
    case "submit-feedback":
      submitFeedback(event, context, callback);
      break;
  }
};

//---------------------------------- user login ----------------------------------//
module.exports.userlogin = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    /////////////////////////////// DB Connection ///////////////////////////////////
    await connectToDB();
    const data = JSON.parse(event.body);
    console.log("data----------->", data);
    let response;
    const updationData = clone(data);
    // console.log('data==========>', data, "<=====updationData=======>", updationData);

    ///////////////////////// DB Operation //////////////////////////////////////////////
    const existing = await users.find({ email: updationData.email }).lean();
    console.log("existing=======>", existing, typeof updationData.password);
    let temp;
    temp = encrypt(updationData.password);
    console.log("encrypted_password--------------->", temp);
    if (existing && existing[0].password === temp) {
      ////////////////////////////////////////// verify O peration ///////////////////////////////////
      temp = {};
      temp.user_id = existing[0]._id;
      temp.email = existing[0].email;

      console.log("modified-------->", temp);
      const createResponse = await loginschema.create(temp);
      // console.log('createResponse===>', createResponse)
      // const { _id } = createResponse;
      // if (_id) response = { operation: "create", _id: _id };
      temp = {};
      temp.last_login_datetime = moment().valueOf();
      console.log("temp------>", temp);
      /////////////////////////////////////// Update Operation ////////////////////////////////////
      const updateResponese = await users.updateOne(
        { _id: mongoose.Types.ObjectId(existing[0]._id) },
        { $inc: { logincounts: 1 }, temp }
      );
      console.log("updateResponese==========>", updateResponese);
      const { acknowledged, modifiedCount, matchedCount } = updateResponese;
      if (acknowledged === true && matchedCount > 0 && modifiedCount > 0)
        response = {
          operation: "Login Successful",
          updateResponese: createResponse,
        };
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
};
//---------------------------------- user login end----------------------------------//

////////////////////////////////////////////////// Create Or Update BLog /////////////////////////////////////////
async function createUpdateBlog(event, context, callback) {
  // console.log('createUpdateBlog started');
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    /////////////////////////////// DB Connection ///////////////////////////////////
    await connectToDB();
    const { data } = JSON.parse(event.body);
    console.log("data----------->", data);
    let response;

    ///////////////////////////// Data Modification for Creation or Updation /////////////////////////
    const updationData = clone(data);
    if (updationData._id) delete updationData._id;
    // console.log('data==========>', data, "<=====updationData=======>", updationData);

    ///////////////////////// DB Operation //////////////////////////////////////////////
    const existing = await blogs.findById(data._id, { _id: 1 });
    // console.log('existing=======>', existing);

    if (!existing) {
      let priority = updationData.priority;
      if (!updationData.priority) {
        const highestPriority = await blogs
          .find({ priority: { $exists: true } })
          .sort({ priority: -1 })
          .limit(1);
        if (highestPriority.length > 0)
          priority = Number(highestPriority[0].priority) + 1;
      }
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

async function blogEdit(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    console.log("first--------->event", event.queryStringParameters);
    await connectToDB();
    const { id } = event.queryStringParameters;
    console.log("data----------->", id);
    // return
    let response;
    // const reqData = clone(data);
    ///////////////////////// DB Operation //////////////////////////////////////////////
    const existing = await blogs.findById(mongoose.Types.ObjectId(id)).lean();
    console.log("first---------->existing", existing);
    if (existing) response = { operation: "find", result: existing };
    ////////////////////////// Error Response ///////////////////////////////////////////
    if (response === undefined)
      response = { operation: "failed", message: "Something Went Wrong" };
    ///////////////////////////////// Response Send /////////////////////////////////////////
    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: response.result,
      }),
    });
  } catch (error) {
    console.log("first-------->", error);
    callback(null, {
      statusCode: error.statusCode || 300,
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

//--------------------------blog listing--------------------------//
async function bloglisting(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("bloglisting startedddddddddd");
  let req = JSON.parse(event.body);
  console.log("req----------------->", req);
  //-----------------token verification---------------------------//
  // let flag = false;
  // let flag = await verifytoken(req.email,req.token);
  // console.log('flag----------------->', flag);
  // if(!flag){
  //   return callback(null, {
  //     statusCode: 500,
  //     headers: headers,
  //     body: "Access Denied",
  //   })
  // }
  //---------------------------end---------------------------------//
  delete req.searchcondition.token;
  let sortval = {};
  let cond = {};
  let limit = {};
  let skip = {}; //===================================>>>>>>>>>>>>for search(complete)
  delete req.searchcondition.formId; // to delete formid ==== createdon_datetime: {$gte: 1661970600000, $lte: 1664562600000}, type: "admin"
  if (req.searchcondition.startDate && req.searchcondition.endDate) {
    cond.createdon_datetime = {
      $gte: req.searchcondition.startDate,
      $lte: req.searchcondition.endDate,
    };
  } else if (
    typeof req.searchcondition != "undefined" &&
    req.searchcondition != null
  ) {
    cond = req.searchcondition;
  }
  console.log("cond1", cond);
  if (req.sort != undefined && req.sort != null && req.sort.type == "asc") {
    req.sort.type = 1;
    sortval[req.sort.field] = req.sort.type;
  } else if (
    req.sort != undefined &&
    req.sort != null &&
    req.sort.type == "desc"
  ) {
    req.sort.type = -1;
    sortval[req.sort.field] = req.sort.type;
  }
  sortval.updated_datetime = -1;
  if (req.condition !== null && req.condition !== undefined)
    limit = req.condition.limit;
  if (req.condition !== null && req.condition !== undefined)
    skip = req.condition.skip;
  console.log("cond-------------------Date222++++", cond, sortval);
  connectToDB().then(() => {
    blogs
      .find(cond)
      .sort(sortval)
      .limit(limit)
      .skip(skip)
      .lean()
      .then((response) => {
        const modifiedResponse = response.map((res) => {
          const obj = { ...res };
          if (res.images && res.images.length > 0)
            obj.image = res.images[0].url;
          return obj;
        });
        callback(null, {
          headers: headers,
          statusCode: 200,
          body: JSON.stringify({
            status: "success",
            results: {
              res: modifiedResponse,
            },
            relation: req.relation ? req.relation : undefined,
            reqbody: req,
          }),
        });
      })
      .catch((err) =>
        callback(null, {
          statusCode: err.statusCode || 500,
          headers: headers,
          body: "Could not fetch the notes.",
        })
      );
  });
}
//--------------------------------blog listcount----------------------//
function bloglistingcount(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("blogcount startedddddddddd");
  let req = JSON.parse(event.body);
  let cond = {};
  if (req.searchcondition.startDate && req.searchcondition.endDate) {
    cond.createdon_datetime = {
      $gte: req.searchcondition.startDate,
      $lte: req.searchcondition.endDate,
    };
  } else if (
    typeof req.searchcondition != "undefined" &&
    req.searchcondition != null
  ) {
    cond = req.searchcondition;
  }
  console.log("req=======", req);
  connectToDB().then(() => {
    blogs
      .find(cond)
      .count()
      .then((response) => {
        callback(null, {
          headers: headers,
          statusCode: 200,
          body: JSON.stringify({
            status: "success",
            count: response,
          }),
        });
      })
      .catch((err) =>
        callback(null, {
          statusCode: err.statusCode || 500,
          headers: headers,
          body: "Could not fetch the notes.",
        })
      );
  });
}

//--------------------------Portfolio listing--------------------------//
async function portfoliolisting(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("Portfoliolisting startedddddddddd");
  let req = JSON.parse(event.body);
  console.log("req----------------->", req);
  //-----------------token verification---------------------------//
  // let flag = false;
  // let flag = await verifytoken(req.email,req.token);
  // console.log('flag----------------->', flag);
  // if(!flag){
  //   return callback(null, {
  //     statusCode: 500,
  //     headers: headers,
  //     body: "Access Denied",
  //   })
  // }
  //---------------------------end---------------------------------//
  delete req.searchcondition.token;
  let sortval = {};
  let cond = {};
  let limit = {};
  let skip = {}; //===================================>>>>>>>>>>>>for search(complete)
  delete req.searchcondition.formId; // to delete formid ==== createdon_datetime: {$gte: 1661970600000, $lte: 1664562600000}, type: "admin"
  if (req.searchcondition.startDate && req.searchcondition.endDate) {
    cond.createdon_datetime = {
      $gte: req.searchcondition.startDate,
      $lte: req.searchcondition.endDate,
    };
  } else if (
    typeof req.searchcondition != "undefined" &&
    req.searchcondition != null
  ) {
    cond = req.searchcondition;
  }
  console.log("cond1", cond);
  if (req.sort != undefined && req.sort != null && req.sort.type == "asc") {
    req.sort.type = 1;
    sortval[req.sort.field] = req.sort.type;
  } else if (
    req.sort != undefined &&
    req.sort != null &&
    req.sort.type == "desc"
  ) {
    req.sort.type = -1;
    sortval[req.sort.field] = req.sort.type;
  }
  sortval.updated_datetime = -1;
  if (req.condition !== null && req.condition !== undefined)
    limit = req.condition.limit;
  if (req.condition !== null && req.condition !== undefined)
    skip = req.condition.skip;
  console.log("cond-------------------Date222++++", cond, sortval);
  connectToDB().then(() => {
    portfolios
      .find(cond)
      .sort(sortval)
      .limit(limit)
      .skip(skip)
      .lean()
      .then((response) => {
        const modifiedResponse = response.map((res) => {
          const obj = { ...res };
          if (res.images && res.images.length > 0)
            obj.image = res.images[0].url;
          return obj;
        });
        console.log("modifiedResponse==========>", modifiedResponse);
        callback(null, {
          headers: headers,
          statusCode: 200,
          body: JSON.stringify({
            status: "success",
            results: {
              res: modifiedResponse,
            },
            relation: req.relation ? req.relation : undefined,
            reqbody: req,
          }),
        });
      })
      .catch((err) =>
        callback(null, {
          statusCode: err.statusCode || 500,
          headers: headers,
          body: "Could not fetch the notes.",
        })
      );
  });
}
//--------------------------------Portfolio listcount----------------------//
function portfoliolistingcount(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("Portfoliocount startedddddddddd");
  let req = JSON.parse(event.body);
  let cond = {};
  if (req.searchcondition.startDate && req.searchcondition.endDate) {
    cond.createdon_datetime = {
      $gte: req.searchcondition.startDate,
      $lte: req.searchcondition.endDate,
    };
  } else if (
    typeof req.searchcondition != "undefined" &&
    req.searchcondition != null
  ) {
    cond = req.searchcondition;
  }
  console.log("req=======", req);
  connectToDB().then(() => {
    portfolios
      .find(cond)
      .count()
      .then((response) => {
        callback(null, {
          headers: headers,
          statusCode: 200,
          body: JSON.stringify({
            status: "success",
            count: response,
          }),
        });
      })
      .catch((err) =>
        callback(null, {
          statusCode: err.statusCode || 500,
          headers: headers,
          body: "Could not fetch the notes.",
        })
      );
  });
}
////////////////////////////////////////////////// Create Or Update Portfolio /////////////////////////////////////////
async function createUpdateportfolio(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    /////////////////////////////// DB Connection ///////////////////////////////////
    await connectToDB();
    const { data } = JSON.parse(event.body);
    console.log("portfolio---------->started", data);
    let response;

    ///////////////////////////// Data Modification for Creation or Updation /////////////////////////
    const updationData = clone(data);
    if (updationData._id) delete updationData._id;
    console.log(
      "data==========>",
      data,
      "<=====updationData=======>",
      updationData
    );

    ///////////////////////// DB Operation //////////////////////////////////////////////
    const existing = await portfolios.findById(data._id, { _id: 1 });
    // console.log('existing=======>', existing);

    if (!existing) {
      ////////////////////////////////////////// Create Operation ///////////////////////////////////
      const createResponse = await portfolios.create(updationData);
      // console.log('createResponse===>', createResponse)
      const { _id } = createResponse;
      if (_id) response = { operation: "create", _id: _id };
    } else {
      /////////////////////////////////////// Update Operation ////////////////////////////////////
      const updateResponese = await portfolios.updateOne(
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

async function portfolioEdit(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    console.log("first--------->event", event.queryStringParameters);
    await connectToDB();
    const { id } = event.queryStringParameters;
    console.log("data----------->", id);
    // return
    let response;
    // const reqData = clone(data);
    ///////////////////////// DB Operation //////////////////////////////////////////////
    const existing = await portfolios
      .findById(mongoose.Types.ObjectId(id))
      .lean();
    console.log("first---------->existing", existing);
    if (existing) response = { operation: "find", result: existing };
    ////////////////////////// Error Response ///////////////////////////////////////////
    if (response === undefined)
      response = { operation: "failed", message: "Something Went Wrong" };
    ///////////////////////////////// Response Send /////////////////////////////////////////
    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: response.result,
      }),
    });
  } catch (error) {
    console.log("first-------->", error);
    callback(null, {
      statusCode: error.statusCode || 300,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Connection problem" + String(error),
    });
  }
}

/////////////////////////////////////////// Delete Single Blog ///////////////////////////////////////////////
async function deleteSingleBlog(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const { id } = JSON.parse(event.body);
    console.log("id=====================>", id);
    await connectToDB();
    const deleteResponse = await blogs.deleteOne({
      _id: mongoose.Types.ObjectId(id),
    });
    console.log("deleteResponse==============>", deleteResponse);
    if (
      deleteResponse.acknowledged === false ||
      deleteResponse.deletedCount === 0
    )
      throw "No Items Deleted";

    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: deleteResponse,
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

/////////////////////////////////////////// Delete Single Blog ///////////////////////////////////////////////
async function deleteSinglePortfolio(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const { id } = JSON.parse(event.body);
    console.log("id=====================>", id);
    await connectToDB();
    const deleteResponse = await portfolio.deleteOne({
      _id: mongoose.Types.ObjectId(id),
    });
    console.log("deleteResponse==============>", deleteResponse);
    if (
      deleteResponse.acknowledged === false ||
      deleteResponse.deletedCount === 0
    )
      throw "No Items Deleted";

    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: deleteResponse,
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

async function fetchServiceCategories(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    await connectToDB();
    const response = await services.distinct("name", { status: 1 });
    console.log("response==============>", response);

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

//////////////////////////////////////// fetchBlogDetails //////////////////////////////////////
async function fetchBlogDetails(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const params = event.queryStringParameters;
  console.log("params.id==============>", params.id);

  try {
    await connectToDB();

    let results = await async.parallel({
      blogData: async () => {
        let blogData;
        if (params.id)
          blogData = await blogs.find({ _id: mongoose.Types.ObjectId(params.id) });
        else blogData = await blogs.find().sort({ priority: 1 }).limit(1);
        return blogData;
      },
      recentBlogs: async () => {
        let recentBlogs;
        if (params.id)
          recentBlogs = await blogs
            .find({ _id: { $ne: mongoose.Types.ObjectId(params.id) } })
            .sort({ date: -1 })
            .limit(5);
        else recentBlogs = await blogs.find({}).sort({ date: -1 }).limit(5);
        return recentBlogs;
      },
      categories: async () => {
        const categories = [];
        const categoryTypes = await blogs.distinct("category");

        await Promise.all(
          categoryTypes.map(async (cat) => {
            const catCount = await blogs.find({ category: cat }).count();
            categories.push({ category: cat, count: catCount });
          })
        );
        return categories;
      },
    });

    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: results,
      }),
    });
  } catch (error) {
    console.log("error================>", error);
    callback(null, {
      statusCode: error.statusCode || 500,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Connection problem" + String(error),
    });
  }
}

////////////////////////////////////// fetchPortfoliosByCategories /////////////////////////////////
async function fetchPortfoliosByCategories(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const params = event.queryStringParameters;
  console.log("cat==============>", params.cat);
  let sortVal = { priority: 1 };

  try {
    await connectToDB();
    if (params && params.sort) {
      params.type === "asc"
        ? (sortVal = { [params.sort]: 1 })
        : (sortVal = { [params.sort]: -1 });
    }

    const portfolios = await portfolio
      .find({
        category: { $regex: params.cat ? params.cat : "", $options: "i" },
        status: 1,
      })
      .sort(sortVal);

    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: portfolios,
      }),
    });
  } catch (error) {
    console.log("error================>", error);
    callback(null, {
      statusCode: error.statusCode || 500,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Connection problem" + String(error),
    });
  }
}

////////////////////////////////////////////////// Create Or Update Service /////////////////////////////////////////
async function createUpdateService(event, context, callback) {
  // console.log('createUpdateService started');
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    /////////////////////////////// DB Connection ///////////////////////////////////
    await connectToDB();
    const { data } = JSON.parse(event.body);
    console.log("data----------->", data);
    let response;

    ///////////////////////////// Data Modification for Creation or Updation /////////////////////////
    const updationData = clone(data);
    if (updationData._id) delete updationData._id;
    // console.log('data==========>', data, "<=====updationData=======>", updationData);

    ///////////////////////// DB Operation //////////////////////////////////////////////
    const existing = await services.findById(data._id, { _id: 1 });
    // console.log('existing=======>', existing);

    if (!existing) {
      ////////////////////////////////////////// Create Operation ///////////////////////////////////
      const createResponse = await services.create(updationData);
      // console.log('createResponse===>', createResponse)
      const { _id } = createResponse;
      if (_id) response = { operation: "create", _id: _id };
    } else {
      /////////////////////////////////////// Update Operation ////////////////////////////////////
      const updateResponese = await services.updateOne(
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
/////////////////////////////////////////// Delete Single Service ///////////////////////////////////////////////
async function deleteSingleService(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const { id } = JSON.parse(event.body);
    console.log("id=====================>", id);
    await connectToDB();
    const deleteResponse = await services.deleteOne({
      _id: mongoose.Types.ObjectId(id),
    });
    console.log("deleteResponse==============>", deleteResponse);
    if (
      deleteResponse.acknowledged === false ||
      deleteResponse.deletedCount === 0
    )
      throw "No Items Deleted";

    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: deleteResponse,
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
//--------------------------Service listing--------------------------//
async function serviceListing(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("Portfoliolisting startedddddddddd");
  let req = JSON.parse(event.body);
  console.log("req----------------->", req);
  //-----------------token verification---------------------------//
  // let flag = false;
  // let flag = await verifytoken(req.email,req.token);
  // console.log('flag----------------->', flag);
  // if(!flag){
  //   return callback(null, {
  //     statusCode: 500,
  //     headers: headers,
  //     body: "Access Denied",
  //   })
  // }
  //---------------------------end---------------------------------//
  delete req.searchcondition.token;
  let sortval = {};
  let cond = {};
  let limit = {};
  let skip = {}; //===================================>>>>>>>>>>>>for search(complete)
  delete req.searchcondition.formId; // to delete formid ==== createdon_datetime: {$gte: 1661970600000, $lte: 1664562600000}, type: "admin"
  if (req.searchcondition.startDate && req.searchcondition.endDate) {
    cond.createdon_datetime = {
      $gte: req.searchcondition.startDate,
      $lte: req.searchcondition.endDate,
    };
  } else if (
    typeof req.searchcondition != "undefined" &&
    req.searchcondition != null
  ) {
    cond = req.searchcondition;
  }
  console.log("cond1", cond);
  if (req.sort != undefined && req.sort != null && req.sort.type == "asc") {
    req.sort.type = 1;
    sortval[req.sort.field] = req.sort.type;
  } else if (
    req.sort != undefined &&
    req.sort != null &&
    req.sort.type == "desc"
  ) {
    req.sort.type = -1;
    sortval[req.sort.field] = req.sort.type;
  }
  sortval.updated_datetime = -1;
  if (req.condition !== null && req.condition !== undefined)
    limit = req.condition.limit;
  if (req.condition !== null && req.condition !== undefined)
    skip = req.condition.skip;
  console.log("cond-------------------Date222++++", cond, sortval);
  connectToDB().then(() => {
    services
      .find(cond)
      .sort(sortval)
      .limit(limit)
      .skip(skip)
      .lean()
      .then((response) => {
        const modifiedResponse = response.map((res) => {
          const obj = { ...res };
          if (res.images && res.images.length > 0)
            obj.image = res.images[0].url;
          return obj;
        });
        console.log("modifiedResponse==========>", modifiedResponse);
        callback(null, {
          headers: headers,
          statusCode: 200,
          body: JSON.stringify({
            status: "success",
            results: {
              res: modifiedResponse,
            },
            relation: req.relation ? req.relation : undefined,
            reqbody: req,
          }),
        });
      })
      .catch((err) =>
        callback(null, {
          statusCode: err.statusCode || 500,
          headers: headers,
          body: "Could not fetch the notes.",
        })
      );
  });
}
//--------------------------------Service listcount----------------------//
function serviceListingCount(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("Portfoliocount startedddddddddd");
  let req = JSON.parse(event.body);
  let cond = {};
  if (req.searchcondition.startDate && req.searchcondition.endDate) {
    cond.createdon_datetime = {
      $gte: req.searchcondition.startDate,
      $lte: req.searchcondition.endDate,
    };
  } else if (
    typeof req.searchcondition != "undefined" &&
    req.searchcondition != null
  ) {
    cond = req.searchcondition;
  }
  console.log("req=======", req);
  connectToDB().then(() => {
    services
      .find(cond)
      .count()
      .then((response) => {
        callback(null, {
          headers: headers,
          statusCode: 200,
          body: JSON.stringify({
            status: "success",
            count: response,
          }),
        });
      })
      .catch((err) =>
        callback(null, {
          statusCode: err.statusCode || 500,
          headers: headers,
          body: "Could not fetch the notes.",
        })
      );
  });
}

async function fetchBlogsByCategories(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const params = event.queryStringParameters;
  let sortVal = { priority: 1 };

  console.log("cat==============>", params.cat);

  try {
    await connectToDB();
    let category = "";
    if (params.cat) category = params.cat;
    if (params && params.sort) {
      params.type === "asc"
        ? (sortVal = { [params.sort]: 1 })
        : (sortVal = { [params.sort]: -1 });
    }
    const blogsData = await blogs
      .find({
        category: { $regex: params.cat, $options: "i" },
        status: 1,
      })
      .sort(sortVal);

    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: blogsData,
      }),
    });
  } catch (error) {
    console.log("error================>", error);
    callback(null, {
      statusCode: error.statusCode || 500,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Connection problem" + String(error),
    });
  }
}

////////////////////////////////// fetchServices /////////////////////////////////
async function fetchServices(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  const params = event.queryStringParameters;
  let sortVal = { priority: 1 };

  console.log("params==============>", params);

  let limit = 0;
  let skip = 0;

  if (params && params.skip && Number(params.skip)) skip = Number(params.skip);
  if (params && params.limit && Number(params.limit))
    limit = Number(params.limit);

  if (params && params.sort) {
    params.type === "asc"
      ? (sortVal = { [params.sort]: 1 })
      : (sortVal = { [params.sort]: -1 });
  }

  try {
    await connectToDB();

    const serviceData = await services
      .find({ status: 1 })
      .sort(sortVal)
      .skip(skip)
      .limit(limit);

    callback(null, {
      headers: headers,
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        response: serviceData,
      }),
    });
  } catch (error) {
    console.log("error================>", error);
    callback(null, {
      statusCode: error.statusCode || 500,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Connection problem" + String(error),
    });
  }
}

async function quoteListing(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("Portfoliolisting startedddddddddd");
  let req = JSON.parse(event.body);
  console.log("req----------------->", req);
  //-----------------token verification---------------------------//
  // let flag = false;
  // let flag = await verifytoken(req.email,req.token);
  // console.log('flag----------------->', flag);
  // if(!flag){
  //   return callback(null, {
  //     statusCode: 500,
  //     headers: headers,
  //     body: "Access Denied",
  //   })
  // }
  //---------------------------end---------------------------------//
  delete req.searchcondition.token;
  let sortval = {};
  let cond = {};
  let limit = {};
  let skip = {}; //===================================>>>>>>>>>>>>for search(complete)
  delete req.searchcondition.formId; // to delete formid ==== createdon_datetime: {$gte: 1661970600000, $lte: 1664562600000}, type: "admin"
  if (req.searchcondition.startDate && req.searchcondition.endDate) {
    cond.createdon_datetime = {
      $gte: req.searchcondition.startDate,
      $lte: req.searchcondition.endDate,
    };
  } else if (
    typeof req.searchcondition != "undefined" &&
    req.searchcondition != null
  ) {
    cond = req.searchcondition;
  }
  console.log("cond1", cond);
  if (req.sort != undefined && req.sort != null && req.sort.type == "asc") {
    req.sort.type = 1;
    sortval[req.sort.field] = req.sort.type;
  } else if (
    req.sort != undefined &&
    req.sort != null &&
    req.sort.type == "desc"
  ) {
    req.sort.type = -1;
    sortval[req.sort.field] = req.sort.type;
  }
  sortval.updated_datetime = -1;
  if (req.condition !== null && req.condition !== undefined)
    limit = req.condition.limit;
  if (req.condition !== null && req.condition !== undefined)
    skip = req.condition.skip;
  console.log("cond-------------------Date222++++", cond, sortval);
  connectToDB().then(() => {
    get_quote
      .find(cond)
      .sort(sortval)
      .limit(limit)
      .skip(skip)
      .lean()
      .then((response) => {
        callback(null, {
          headers: headers,
          statusCode: 200,
          body: JSON.stringify({
            status: "success",
            results: {
              res: response,
            },
            relation: req.relation ? req.relation : undefined,
            reqbody: req,
          }),
        });
      })
      .catch((err) =>
        callback(null, {
          statusCode: err.statusCode || 500,
          headers: headers,
          body: "Could not fetch the notes.",
        })
      );
  });
}
//--------------------------------Service listcount----------------------//
function quoteListingCount(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("Portfoliocount startedddddddddd");
  let req = JSON.parse(event.body);
  let cond = {};
  if (req.searchcondition.startDate && req.searchcondition.endDate) {
    cond.createdon_datetime = {
      $gte: req.searchcondition.startDate,
      $lte: req.searchcondition.endDate,
    };
  } else if (
    typeof req.searchcondition != "undefined" &&
    req.searchcondition != null
  ) {
    cond = req.searchcondition;
  }
  console.log("req=======", req);
  connectToDB().then(() => {
    get_quote
      .find(cond)
      .count()
      .then((response) => {
        callback(null, {
          headers: headers,
          statusCode: 200,
          body: JSON.stringify({
            status: "success",
            count: response,
          }),
        });
      })
      .catch((err) =>
        callback(null, {
          statusCode: err.statusCode || 500,
          headers: headers,
          body: "Could not fetch the notes.",
        })
      );
  });
}

async function submitFeedback(event, context, callback) {
  try {
    const req = JSON.parse(event.body);
    if (!req.blog_id) throw "Blog Id Required"
    const blogId = req.blog_id;
    delete req.blog_id;
    delete req.formId;

    await connectToDB();

    const response = await blogs.updateOne({ _id: mongoose.Types.ObjectId(blogId) }, { $push: { feedback: { ...req, createdon_datetime: moment().valueOf() } } })

    if (response.acknowledged === true && response.matchedCount > 0 && response.modifiedCount > 0) {
      callback(null, {
        headers: headers,
        statusCode: 200,
        body: JSON.stringify({
          status: "success",
          results: response
        }),
      });
    } else throw "Feedback Not Submitted. Please Try Again :("


  } catch (error) {
    console.log("error================>", error);
    callback(null, {
      statusCode: error.statusCode || 500,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Connection problem" + String(error),
    });
  }
}