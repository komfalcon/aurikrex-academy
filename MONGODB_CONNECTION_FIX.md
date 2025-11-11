# MongoDB Connection Fix

## Problem
The application was experiencing connection timeout errors (ETIMEDOUT) when trying to connect to MongoDB Atlas. The error logs showed:

```
connect ETIMEDOUT 89.194.93.44:27017
```

## Root Cause
MongoDB Atlas now requires the Stable API version to be specified in the connection configuration. The `serverApi` option was missing from the MongoDB client options, which is now mandatory for MongoDB Atlas connections.

## Solution
Added the required `serverApi` configuration to the MongoDB client options in `/aurikrex-backend/src/config/mongodb.ts`:

```typescript
import { MongoClient, Db, MongoClientOptions, ServerApiVersion } from 'mongodb';

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
};
```

## Changes Made
1. **Import ServerApiVersion**: Added `ServerApiVersion` to the imports from the `mongodb` package
2. **Configure serverApi**: Added the `serverApi` configuration object to `MongoClientOptions`

## Configuration Details

### serverApi Options
- **version**: `ServerApiVersion.v1` - Uses the stable API version 1
- **strict**: `true` - Enforces strict schema validation
- **deprecationErrors**: `true` - Throws errors for deprecated features

This configuration ensures compatibility with MongoDB Atlas and follows MongoDB's recommended best practices.

## Testing
The fix has been verified by:
1. ✅ TypeScript compilation successful
2. ✅ Code builds without errors
3. ✅ Server starts successfully
4. ✅ Configuration matches MongoDB Atlas official connection pattern

## References
- MongoDB Stable API Documentation: https://www.mongodb.com/docs/drivers/node/current/fundamentals/stable-api/
- MongoDB Atlas Connection Guide: https://www.mongodb.com/docs/atlas/driver-connection/

## Environment Setup
Ensure your `.env` file contains the correct MongoDB connection string:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.sknrqn8.mongodb.net/aurikrex-academy?retryWrites=true&w=majority
MONGO_DB_NAME=aurikrex-academy
```

Replace `username` and `password` with your actual MongoDB Atlas credentials.
