# Typescript AWS CDK todo(ish) api

_Infrastructure as code framework used_: AWS CDK
_AWS Services used_: AWS Lambda, AWS DynamoDB

## Summary of the api

In this setup, you can sign up, verify, and login using Amazon Cognito. Additionally, you can create, read, update, and delete to-do tasks using the API.

Given more time, I would have implemented the following features to improve the application:
- Magic links for account verification
- Rate limiting using API keys
- More comprehensive models for data storage
- A comprehensive suite of tests to ensure the stability and reliability of the application
- Detailed documentation, including an OpenAPI specification for generating the API automatically
- A security audit to identify and mitigate any potential vulnerabilities.


## Requirements

- AWS CLI already configured with Administrator permission
- AWS CDK - v2
- NodeJS 14.x installed
- CDK bootstrapped in your account

## Deploy this demo

Deploy the project to the cloud:

```
cdk synth
cdk deploy
```

When asked about functions that may not have authorization defined, answer (y)es. The access to those functions will be open to anyone, so keep the app deployed only for the time you need this demo running.

To delete the app:

```
cdk destroy
```

## Endpoints
### /signup
This endpoint creates a new user in the Cognito user pool.

#### Method: POST

Request Body:
- email (string): email of the user
- password (string): password of the user
- username (string): username of the user

Response:
- message (string): Descriptive message about the outcome of the request

### /login
This endpoint logs in an existing user and returns a JWT.

#### Method: POST

Request Body:
- email (string): email of the user
- password (string): password of the user

Response:
- message (string): Descriptive message about the outcome of the request
- token (string): JWT for the authenticated user

### /verify?code={awsCode}&username={userame}
This endpoint verifies a user using a AWS verification code sent to the user by email.

#### Method: GET

Request Query parameters:
- code (string): Aws confirmation code
- username (string): Username of the account to verify

Response:
- message (string): Descriptive message about the outcome of the request

### /todo_tasks
This endpoint is used to manage to-do tasks.

Method:
- GET: Retrieve all tasks for the authenticated user
- POST: Create a new task for the authenticated user

### /todo_tasks/{taskId}
- PUT: Update an existing task for the authenticated user
- DELETE: Delete a task for the authenticated user
- GET: Retrieve a single task for the authenticated user

Request Body (POST and PUT only):
- taskDetails (string): Description of the task
- taskCompleted (Boolean): Task completion status

Response:
- message (string): Descriptive message about the outcome of the request
- data (list of tasks): List of tasks for the authenticated user

Authentication
The API uses Amazon Cognito to authenticate users. Requests to the API must include a valid JWT in the Authorization header.

### AWS CDK useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests (still to write)
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
