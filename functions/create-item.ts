import * as AWS from 'aws-sdk';
import {v4 as uuidv4} from 'uuid';


const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

export const handler = async (event: any = {}): Promise<any> => {
    
  if (!event.body) {
    return { statusCode: 400, body: "Bad Request: missing body" };
  }

  const item = typeof event.body == "object" ? event.body : JSON.parse(event.body);
  const userId = event.requestContext.authorizer.claims.sub;


  item[PRIMARY_KEY] = uuidv4();
  item["owner_id"] = userId;
  const params = {
    TableName: TABLE_NAME,
    Item: item,
  };

  try {
    await db.put(params).promise();
    return { statusCode: 200, body: JSON.stringify(item) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
