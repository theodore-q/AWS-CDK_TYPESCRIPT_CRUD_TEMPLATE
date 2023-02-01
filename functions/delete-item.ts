import * as AWS from "aws-sdk";

const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

export const handler = async (event: any = {}): Promise<any> => {
  const requestedItemId = event.pathParameters.id;
  const userId = event.requestContext.authorizer.claims.sub;
  if (!requestedItemId) {
    return {
      statusCode: 400,
      body: "Bad Request: missing the path parameter id",
    };
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: requestedItemId,
    },
  };

  try {
    const result = await db.get(params).promise();
    const item = result.Item;
    if (item && item.owner_id === userId) {
      await db.delete(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Task deleted successfully",
        }),
      };
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "You do not have permission to delete this task",
        }),
      };
    }
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
