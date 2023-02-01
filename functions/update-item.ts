import * as AWS from "aws-sdk";

const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

export const handler = async (event: any = {}): Promise<any> => {
  if (!event.body) {
    return { statusCode: 400, body: "Bad Request: missing body" };
  }

  const editedItemId = event.pathParameters.id;
  if (!editedItemId) {
    return {
      statusCode: 400,
      body: "Bad Request: missing the path parameter id",
    };
  }

  const editedItem: any =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);
  const userId = event.requestContext.authorizer.claims.sub;
  const editedItemProperties = Object.keys(editedItem);
  if (!editedItem || editedItemProperties.length < 1) {
    return { statusCode: 400, body: "Bad Request: empty body" };
  }

  if (editedItem.owner_id) {
    return {
      statusCode: 401,
      body: "Unauthorized: You are not allowed to modify property owner_id",
    };
  }

  try {
    const existingItemParams: any = {
      TableName: TABLE_NAME,
      Key: {
        [PRIMARY_KEY]: editedItemId,
      },
    };

    const existingItem = await db.get(existingItemParams).promise();

    if (!existingItem.Item || existingItem.Item.ownerId !== userId) {
      return {
        statusCode: 401,
        body: "Unauthorized: You are not allowed to modify this item",
      };
    }

    const firstProperty = editedItemProperties.splice(0, 1);
    const params: any = {
      TableName: TABLE_NAME,
      Key: {
        [PRIMARY_KEY]: editedItemId,
      },
      UpdateExpression: `set ${firstProperty} = :${firstProperty}`,
      ExpressionAttributeValues: {},
      ReturnValues: "ALL_NEW",
    };
    params.ExpressionAttributeValues[`:${firstProperty}`] =
      editedItem[`${firstProperty}`];

    editedItemProperties.forEach((property) => {
      params.UpdateExpression += `, ${property} = :${property}`;
      params.ExpressionAttributeValues[`:${property}`] = editedItem[property];
    });

    const updatedItem = await db.update(params).promise();
    return { statusCode: 200, body: JSON.stringify(updatedItem) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
