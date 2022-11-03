const aws = require("aws-sdk");
const ses = new aws.SES({ region: "us-east-2" });

let headers = {
  // headers let the client and the server pass additional information with an HTTP request or response.
  "Access-Control-Allow-Origin": "*", // The Access-Control-Allow-Origin header included in the response from one website to a request originating from another website, and identifies the permitted origin of the request
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token", //??
  "Access-Control-Allow-Credentials": true, // ??
  "Content-Type": "application/json",
};

module.exports.api = async (event, context, callback) => {
  try {
    const params = {
      Destination: {
        ToAddresses: ["soumyabratakarmakar1999@outlook.com"],
      },
      Message: {
        Body: {
          Text: { Data: "Test" },
        },

        Subject: { Data: "Test Email" },
      },
      Source: "support@dev.consultancy.kolkatainteriors.com",
    };

    const response = await ses.sendEmail(params).promise();

    callback(null, {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ status: "success", results: response }),
    });

  } catch (error) {
    console.log("error=================>", error);
    callback(null, {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ status: "success", results: response }),
    });
  }
};
