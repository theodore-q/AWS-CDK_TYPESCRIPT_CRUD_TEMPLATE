const CognitoIdentityServiceProvider = require("aws-sdk/clients/cognitoidentityserviceprovider");

export const handler = async (event: any = {}): Promise<any> => {
  const cognitoISP = new CognitoIdentityServiceProvider();
  let body =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);

  const params = {
    ClientId: process.env.USER_POOL_CLIENT_ID,
    Username: body.username,
    Password: body.password,
    UserAttributes: [
      {
        Name: "email",
        Value: body.email,
      },
    ],
  };

  console.log(params);

  try {
    const _data = await cognitoISP.signUp(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User created successfully" }),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error creating user ${err} ${body} dsf: ${
          body.username
        }::: ${typeof body}`,
      }),
    };
  }
};
