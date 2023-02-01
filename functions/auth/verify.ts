// verify user lambda function

import { Handler } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";

const cognitoISP = new CognitoIdentityServiceProvider();

export const handler = async (event: any = {}): Promise<any> => {
  return await verifyUser(event);
};

async function verifyUser(event: any) {
  const username = event.queryStringParameters.username;
  const code = event.queryStringParameters.code;

  const params = {
    ClientId: process.env.USER_POOL_CLIENT_ID || "",
    ConfirmationCode: code,
    Username: username,
  };

  try {
    const result = await cognitoISP.confirmSignUp(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `User verified successfully`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
}
