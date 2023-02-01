import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';

import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import {Runtime, FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { JsonSchemaType, RequestValidator } from 'aws-cdk-lib/aws-apigateway';

export class CdkTypescriptStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const tableName = "todo_tasks";
    const partitionKeyName = "taskId";

    //Dynamodb table definition
    const table = new Table(this, tableName, {
      partitionKey: { name: partitionKeyName, type: AttributeType.STRING },
      tableName: tableName,
      removalPolicy: RemovalPolicy.DESTROY, // only for development purposes
    });

      // Define the Cognito User Pool
      const userPool = new cognito.UserPool(this, 'MyUserPool', {
      userPoolName: 'MyUserPool',
      selfSignUpEnabled: true,
      autoVerify: { email: true },
    });

    //Define the Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'MyUserPoolClient', {
      userPool: userPool,
      userPoolClientName: 'MyUserPoolClient',
      generateSecret: false,      
      authFlows: {
        userPassword: true,
      }
    });

    const userManagmentRole = new iam.Role(this, 'userManagmentRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    
    userManagmentRole.addToPolicy(new iam.PolicyStatement({
        actions: ['cognito-idp:SignUp','cognito-idp:AdminConfirmSignUp'],
        resources: [userPool.userPoolArn],
    }));


    const createUser = new NodejsFunction(this, "CreateUser", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../functions/auth/signup.ts`),
      handler: "handler",
      environment: {
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      role: userManagmentRole,
    });

    const login = new NodejsFunction(this, "Login", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../functions/auth/login.ts`),
      handler: "handler",
      environment: {
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      role: userManagmentRole,
    });

    const verifyUser = new NodejsFunction(this, "VerifyUser", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../functions/auth/verify.ts`),
      handler: "handler",
      environment: {
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      role: userManagmentRole,
    });

    const createItem = new NodejsFunction(this, "createItem", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../functions/create-item.ts`),
      handler: "handler",
      environment: {
        TABLE_NAME: tableName,
        PRIMARY_KEY: partitionKeyName,
      },
    });

    const readItems = new NodejsFunction(this, "readItems", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../functions/read-items.ts`),
      handler: "handler",
      environment: {
        TABLE_NAME: tableName,
        PRIMARY_KEY: partitionKeyName,
      },
    });

    const deleteItem = new NodejsFunction(this, "deleteItem", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../functions/delete-item.ts`),
      handler: "handler",
      environment: {
        TABLE_NAME: tableName,
        PRIMARY_KEY: partitionKeyName,
      },
    });

    const updateItem = new NodejsFunction(this, "updateItem", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, `/../functions/update-item.ts`),
      handler: "handler",
      environment: {
        TABLE_NAME: tableName,
        PRIMARY_KEY: partitionKeyName,
      },
    });

    // we could limit the access to the table only to the functions that need it if needed
    table.grantReadWriteData(createItem);
    table.grantReadData(readItems);
    table.grantReadWriteData(deleteItem);
    table.grantReadWriteData(updateItem);


    const api = new apigateway.RestApi(this, "crudAPIDynamoDB", {
      restApiName: "CRUD Service for DynamoDB",
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    const todoModel = new apigateway.Model(this, "model-validator", {
      restApi: api,
      contentType: "application/json",
      description: "To validate the request body",
      modelName: "todoModel",
      schema: {
        type: JsonSchemaType.OBJECT,
        required: ["taskDetails"],
        properties: {
          taskDetails: {
            type: JsonSchemaType.STRING,
           },
           taskCompleted: {
            type: JsonSchemaType.BOOLEAN,
            default: false,
           },
        },
      },
    });

    const apiRoot = api.root.addResource(tableName,{
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: cognitoAuthorizer,
        requestValidator: new apigateway.RequestValidator(this, "RequestValidator", {
          restApi: api,
          requestValidatorName: "todo-model-validator",
          validateRequestBody: true,
          validateRequestParameters: false,
        }),
        requestModels: {
          "application/json": todoModel,
        },
    }});

    apiRoot.addMethod("POST", new apigateway.LambdaIntegration(createItem));

    apiRoot.addMethod("GET", new apigateway.LambdaIntegration(readItems));

    const idResource = apiRoot.addResource("{id}");
    idResource.addMethod("GET", new apigateway.LambdaIntegration(readItems));
    idResource.addMethod("PUT", new apigateway.LambdaIntegration(updateItem));
    idResource.addMethod("DELETE", new apigateway.LambdaIntegration(deleteItem));

   const userResource = api.root.addResource("signup");
   userResource.addMethod("POST", new apigateway.LambdaIntegration(createUser));

    const loginResource = api.root.addResource("login");
    loginResource.addMethod("POST", new apigateway.LambdaIntegration(login));

    const verifyResource = api.root.addResource("verify");
    verifyResource.addMethod("GET", new apigateway.LambdaIntegration(verifyUser));
  }
}