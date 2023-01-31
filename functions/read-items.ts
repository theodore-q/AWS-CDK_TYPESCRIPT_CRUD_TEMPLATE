import * as AWS from 'aws-sdk';

const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

export const handler = async (event: any = {}): Promise<any> => {
  const userId = event.requestContext.authorizer.claims.sub;
  if (!event.pathParameters) {
    try {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'owner_id = :value',
        ExpressionAttributeValues: {
          ':value': userId,
        },
      };
      const response = await db.scan(params).promise();
      return { statusCode: 200, body: JSON.stringify(response.Items) };
    } catch (dbError) {
      return { statusCode: 500, body: JSON.stringify(dbError) };
    }
  } else {
    const requestedItemId = event.pathParameters.id;
    if (!requestedItemId) {
      return { statusCode: 500, body: "Bad Request: missing id parameter" };
    } else {
      try {
        const params = {
          TableName: TABLE_NAME,
          KeyConditionExpression: `${PRIMARY_KEY} = :itemId`,
          FilterExpression: 'owner_id = :value',
          ExpressionAttributeValues: {
            ":itemId": requestedItemId,
            ':value': userId,
          }
        };
        const response = await db.query(params).promise();
        return { statusCode: 200, body: JSON.stringify(response.Items[0] || {}) };
      } catch (dbError) {
        return { statusCode: 500, body: JSON.stringify(dbError) };
      }
    }
  }
};
