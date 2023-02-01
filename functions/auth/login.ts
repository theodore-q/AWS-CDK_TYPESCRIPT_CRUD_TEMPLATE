const CognitoIdentityServiceProvider = require("aws-sdk/clients/cognitoidentityserviceprovider");

export const handler = async (event: any = {}): Promise<any> => {
  const clientId = process.env.USER_POOL_CLIENT_ID;

  const cognitoISP = new CognitoIdentityServiceProvider();
  const body =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);

  return cognitoISP
    .initiateAuth({
      AuthFlow: "USER_PASSWORD_AUTH",

      AuthParameters: {
        USERNAME: body.username,
        PASSWORD: body.password,
      },
      ClientId: clientId,
    })
    .promise()
    .then((data) => {
      // Extract the JWT token from the response
      const jwtToken = data.AuthenticationResult.IdToken;

      // Return the JWT token to the client
      return {
        statusCode: 200,
        body: JSON.stringify({ jwtToken }),
      };
    })
    .catch((err: any) => {
      // Handle any errors that occurred during authentication
      return {
        statusCode: 200,
        body: JSON.stringify({ message: `User created successfully ${err}` }),
      };
    });
};
