# MongoDB Atlas Connection Fix Guide

## Problem Identified
- **Error**: Server selection timed out after 10000 ms
- **Root Cause**: IP address is not whitelisted in MongoDB Atlas
- **Status**: DNS SRV resolution works ✅ | Authentication works ✅ | IP Whitelist ❌

## Current System Information
- MongoDB URI: `mongodb+srv://moparaji57_db_user:****@cluster0.sknrqn8.mongodb.net/aurikrex-academy`
- Cluster: `cluster0.sknrqn8.mongodb.net`
- Database: `aurikrex-academy`
- Username: `moparaji57_db_user`
- Servers discovered:
  - `ac-wsdrggj-shard-00-02.sknrqn8.mongodb.net:27017`
  - `ac-wsdrggj-shard-00-01.sknrqn8.mongodb.net:27017`
- **Your Current Public IP: `105.113.93.252`** ← This needs to be whitelisted!

## Solution Required: Whitelist IP in MongoDB Atlas

### Steps to Fix:
1. **Get Your Current IP Address**
   - Command: `curl https://api.ipify.org`
   - Or go to: https://whatismyipaddress.com/

2. **Access MongoDB Atlas**
   - Go to: https://cloud.mongodb.com
   - Login with your account
   - Select "Aurikrex Academy" project

3. **Add IP to Network Access**
   - Left menu → "Network Access"
   - Click "Add IP Address"
   - Option A (Recommended for Development):
     - Add your specific IP
     - Example: `203.0.113.42`
   - Option B (Flexible for Testing):
     - Add `0.0.0.0/0` to allow all IPs
     - ⚠️ Note: Not recommended for production!

4. **Verify Configuration**
   - Wait 1-2 minutes for changes to propagate
   - Run: `npm run dev` in the backend directory
   - Check for successful MongoDB connection

## Deployment Consideration
- **For Production (Render)**: The Render app's static IP should be whitelisted
- **For Local Development**: Your home/office IP needs to be whitelisted
- **For CI/CD**: GitHub Actions IP ranges may need whitelisting

## Alternative: Connection String Options
If IP whitelisting is complex, consider:
1. Using Render's static IP (if available in your plan)
2. Using MongoDB Data Federation
3. Switching to MongoDB's Atlas serverless tier (different connection model)

## Current Backend Status
- ✅ Server code running
- ✅ All dependencies installed
- ✅ TypeScript compilation: 0 errors
- ✅ All routes properly typed
- ✅ Middleware configured (CORS, compression, logging, rate limiting)
- ✅ JWT authentication ready
- ❌ MongoDB database connection blocked by IP whitelist

## Once IP is Whitelisted
The backend will be fully functional with:
- User authentication (signup, login, OTP verification)
- Email verification with Titan Mail SMTP
- JWT token management
- Rate limiting and CORS protection
- Full database integration

---
**Note**: After whitelisting the IP, restart the backend with `npm run dev` to reconnect to MongoDB.
