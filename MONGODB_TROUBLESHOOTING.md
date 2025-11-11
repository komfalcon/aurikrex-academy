# MongoDB Atlas Password Recovery & Connection Troubleshooting Guide

## 🔑 How to Reset Your MongoDB Atlas Database User Password

If you've forgotten your MongoDB Atlas database password or need to verify it, follow these steps:

### Step 1: Access MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign in with your MongoDB Atlas account (this is different from your database user)
   - Use the email and password you used to create your MongoDB Atlas account

### Step 2: Navigate to Database Access
1. Once logged in, select your project (e.g., "aurikrex-academy")
2. Click on **"Database Access"** in the left sidebar under the "Security" section
3. You'll see a list of database users

### Step 3: Reset Database User Password
1. Find your database user (e.g., `moparaji57_db_user`)
2. Click the **"Edit"** button (pencil icon) next to the user
3. Click **"Edit Password"**
4. Choose one of these options:
   - **Autogenerate Secure Password**: MongoDB will create a strong password for you
   - **Set your own password**: Create a custom password
5. **IMPORTANT**: Copy the new password immediately! You won't see it again.
6. Click **"Update User"** to save the changes

### Step 4: Update Your Connection String
After resetting the password, you need to update your `.env` file:

1. Open `/aurikrex-backend/.env`
2. Update the `MONGO_URI` with your new password:

```bash
# Old format (replace PASSWORD with your new password):
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.sknrqn8.mongodb.net/?appName=Cluster0

# Example with actual values:
MONGO_URI=mongodb+srv://moparaji57_db_user:YOUR_NEW_PASSWORD@cluster0.sknrqn8.mongodb.net/?appName=Cluster0
```

**Note**: If your password contains special characters (like `@`, `:`, `/`, `?`, `#`, `[`, `]`, `%`), you need to URL-encode them:
- `@` becomes `%40`
- `:` becomes `%3A`
- `/` becomes `%2F`
- `?` becomes `%3F`
- `#` becomes `%23`
- `%` becomes `%25`

Example:
- Password: `MyPass@123!`
- Encoded: `MyPass%40123!`
- URI: `mongodb+srv://username:MyPass%40123!@cluster...`

### Step 5: Test the Connection
```bash
cd aurikrex-backend
npm run dev
```

If successful, you should see:
```
✅ MongoDB Atlas connected successfully
```

---

## 🌐 Network Troubleshooting: IP Whitelist

### Why Am I Getting "Server selection timed out" Error?

The most common reason is that your IP address is not whitelisted in MongoDB Atlas.

### How to Add Your IP Address to the Whitelist

#### Step 1: Find Your Current IP Address
Visit [https://whatismyipaddress.com/](https://whatismyipaddress.com/) or run:
```bash
# Windows PowerShell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content

# Mac/Linux Terminal
curl https://api.ipify.org
```

#### Step 2: Add IP to MongoDB Atlas
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your project
3. Click **"Network Access"** in the left sidebar (under "Security")
4. Click **"Add IP Address"** button
5. Choose one of these options:

   **Option A: Add Current IP Address** (Recommended for testing)
   - Click "Add Current IP Address"
   - It will auto-fill your current IP
   - Add a description (e.g., "Home Network")
   - Click "Confirm"

   **Option B: Allow Access from Anywhere** (Not recommended for production)
   - Click "Allow Access from Anywhere"
   - This adds `0.0.0.0/0` (all IPs)
   - **WARNING**: Less secure, only use for development/testing
   - Click "Confirm"

   **Option C: Add Specific IP Address**
   - Enter your IP address manually
   - Add a description
   - Click "Confirm"

#### Step 3: Wait for Changes to Propagate
- It may take 1-2 minutes for the IP whitelist to update
- Try connecting again after waiting

---

## 🔍 Common MongoDB Connection Errors & Solutions

### Error 1: "Server selection timed out after 5000 ms"

**Causes:**
- IP address not whitelisted
- Network firewall blocking MongoDB Atlas
- VPN interfering with connection
- Incorrect cluster hostname

**Solutions:**
1. ✅ Add your IP to MongoDB Atlas Network Access (see above)
2. ✅ Disable VPN temporarily and try again
3. ✅ Check your firewall settings
4. ✅ Verify the cluster hostname in your connection string:
   ```bash
   # In MONGO_URI, check this part matches your cluster:
   @cluster0.sknrqn8.mongodb.net
   ```
5. ✅ Verify your MongoDB Atlas cluster is running (check Atlas dashboard)

---

### Error 2: "Authentication failed"

**Causes:**
- Incorrect username or password
- Password contains special characters that aren't URL-encoded

**Solutions:**
1. ✅ Reset your database user password (see above)
2. ✅ URL-encode special characters in password
3. ✅ Verify username matches exactly (case-sensitive)
4. ✅ Make sure you're using database user credentials, not Atlas account credentials

---

### Error 3: "ENOTFOUND" or DNS lookup failed

**Causes:**
- Incorrect cluster hostname
- DNS resolution issues

**Solutions:**
1. ✅ Check your connection string format:
   ```bash
   mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/
   ```
2. ✅ Verify cluster hostname in MongoDB Atlas dashboard
3. ✅ Try using a different DNS server (e.g., Google DNS: 8.8.8.8)

---

### Error 4: "bad auth: Authentication failed"

**Causes:**
- Database user doesn't have proper permissions
- User is not assigned to the correct database

**Solutions:**
1. ✅ In MongoDB Atlas > Database Access:
   - Edit the user
   - Ensure "Built-in Role" is set to "Read and write to any database" or specific database
   - Click "Update User"
2. ✅ Verify the database name in `MONGO_DB_NAME` matches your setup

---

## 📋 Complete Configuration Checklist

Before running your application, verify:

- [ ] MongoDB Atlas account is active
- [ ] Database cluster is running (check Atlas dashboard)
- [ ] Database user exists with correct username
- [ ] Database user password is correct and URL-encoded if needed
- [ ] Your current IP address is whitelisted in Network Access
- [ ] Connection string format is correct
- [ ] `.env` file exists in `/aurikrex-backend/`
- [ ] `MONGO_URI` in `.env` matches your cluster details
- [ ] `MONGO_DB_NAME` is set (default: `aurikrex-academy`)

---

## 🔧 Step-by-Step Connection Testing

### 1. Create a Test Connection Script

Create `/aurikrex-backend/test-mongo.js`:

```javascript
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

console.log('🔌 Testing MongoDB Connection...');
console.log('📍 URI format:', uri ? uri.substring(0, 30) + '...' : 'NOT SET');

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
});

async function testConnection() {
  try {
    console.log('⏳ Connecting...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Ping successful!');
    
    const databases = await client.db().admin().listDatabases();
    console.log('📊 Available databases:', databases.databases.map(db => db.name));
    
    console.log('\n🎉 Connection test PASSED!');
  } catch (error) {
    console.error('❌ Connection test FAILED:');
    console.error('   Error:', error.message);
    console.error('\n💡 Next steps:');
    console.error('   1. Check your password in .env');
    console.error('   2. Verify IP whitelist in MongoDB Atlas');
    console.error('   3. See MONGODB_TROUBLESHOOTING.md for more help');
  } finally {
    await client.close();
  }
}

testConnection();
```

### 2. Run the Test

```bash
cd aurikrex-backend
node test-mongo.js
```

### 3. Interpret Results

**✅ Success Output:**
```
🔌 Testing MongoDB Connection...
📍 URI format: mongodb+srv://moparaji57_db_u...
⏳ Connecting...
✅ Connected successfully!
✅ Ping successful!
📊 Available databases: [ 'admin', 'aurikrex-academy' ]
🎉 Connection test PASSED!
```

**❌ Failure Output:**
```
🔌 Testing MongoDB Connection...
📍 URI format: mongodb+srv://moparaji57_db_u...
⏳ Connecting...
❌ Connection test FAILED:
   Error: Server selection timed out after 5000 ms
💡 Next steps:
   1. Check your password in .env
   2. Verify IP whitelist in MongoDB Atlas
   3. See MONGODB_TROUBLESHOOTING.md for more help
```

---

## 🆘 Quick Reference: MongoDB Atlas Dashboard URLs

1. **Login to Atlas**: https://cloud.mongodb.com/
2. **Database Access** (Reset Password): 
   - https://cloud.mongodb.com/ → Select Project → Database Access
3. **Network Access** (IP Whitelist):
   - https://cloud.mongodb.com/ → Select Project → Network Access
4. **Clusters** (View Connection String):
   - https://cloud.mongodb.com/ → Select Project → Clusters → Connect

---

## 📞 Still Having Issues?

### Gather Diagnostic Information

1. **Check Environment Variables:**
   ```bash
   cd aurikrex-backend
   cat .env | grep MONGO
   ```

2. **Test Network Connectivity:**
   ```bash
   # Windows PowerShell
   Test-NetConnection cluster0.sknrqn8.mongodb.net -Port 27017
   
   # Mac/Linux
   nc -zv cluster0.sknrqn8.mongodb.net 27017
   ```

3. **Check MongoDB Atlas Status:**
   - Visit: https://status.mongodb.com/

### Get Help

1. Check the error message carefully
2. Review this troubleshooting guide
3. Check MongoDB Atlas dashboard for cluster status
4. Try the test connection script above
5. Review application logs in `/aurikrex-backend/logs/`

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use strong passwords** (auto-generated is best)
3. **Limit IP whitelist** to only necessary IPs in production
4. **Rotate passwords** periodically (every 90 days)
5. **Use separate database users** for different environments (dev, staging, prod)
6. **Enable MongoDB Atlas alerts** for unauthorized access attempts

---

## 📚 Additional Resources

- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **Connection String Format**: https://docs.mongodb.com/manual/reference/connection-string/
- **Security Best Practices**: https://docs.atlas.mongodb.com/security-best-practices/
- **Troubleshooting Connection Issues**: https://docs.atlas.mongodb.com/troubleshoot-connection/

---

**Last Updated**: November 2024  
**Need More Help?**: Create an issue in the repository or contact info@aurikrex.tech
