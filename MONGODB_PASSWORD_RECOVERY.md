# MongoDB Password Recovery - Quick Guide

## 🔑 How to Get Your MongoDB Password

Your MongoDB Atlas password has likely been forgotten or needs to be reset. Here's the quickest way to fix this:

### Option 1: Reset Password (Recommended)

1. **Login to MongoDB Atlas:**
   - Go to https://cloud.mongodb.com/
   - Login with your MongoDB Atlas account (the email/password you used to sign up)

2. **Navigate to Database Access:**
   - Select your project (e.g., "aurikrex-academy")
   - Click "Database Access" in the left sidebar (under Security)

3. **Reset Your User Password:**
   - Find your user: `moparaji57_db_user`
   - Click the "Edit" button (pencil icon)
   - Click "Edit Password"
   - Choose "Autogenerate Secure Password" or set your own
   - **COPY THE PASSWORD IMMEDIATELY** - you won't see it again!
   - Click "Update User"

4. **Update Your .env File:**
   ```bash
   cd aurikrex-backend
   nano .env  # or use any text editor
   ```
   
   Update the `MONGO_URI` line:
   ```
   MONGO_URI=mongodb+srv://moparaji57_db_user:YOUR_NEW_PASSWORD@cluster0.sknrqn8.mongodb.net/?appName=Cluster0
   ```

5. **Test the Connection:**
   ```bash
   node test-mongo-connection.js
   ```

### Option 2: Check Your Password Manager

If you saved your MongoDB password in a password manager (like LastPass, 1Password, Chrome passwords, etc.), check there first.

### Option 3: Check Old .env Files or Backups

If you have a backup of your .env file or old code, you might find the password there.

---

## ⚠️ Special Characters in Passwords

If your password contains special characters, you MUST URL-encode them:

| Character | Encoded |
|-----------|---------|
| @         | %40     |
| :         | %3A     |
| /         | %2F     |
| ?         | %3F     |
| #         | %23     |
| %         | %25     |

**Example:**
- Password: `MyPass@123!`
- URI: `mongodb+srv://username:MyPass%40123!@cluster0...`

---

## 🌐 Network Issue? (IP Whitelist)

If you reset your password and still get "Server selection timed out", your IP address might not be whitelisted:

1. Go to https://cloud.mongodb.com/
2. Select your project
3. Click "Network Access" (under Security)
4. Click "Add IP Address"
5. Click "Add Current IP Address"
6. Click "Confirm"
7. Wait 1-2 minutes for changes to take effect

---

## 🧪 Test Your Connection

We created a test script to verify everything works:

```bash
cd aurikrex-backend
node test-mongo-connection.js
```

This will tell you exactly what's wrong and how to fix it.

---

## 📚 Full Documentation

For complete troubleshooting information, see:
- **MONGODB_TROUBLESHOOTING.md** - Complete guide
- **aurikrex-backend/README.md** - Backend setup guide

---

## 🚀 Once Fixed, Start Your Server

```bash
cd aurikrex-backend
npm install
npm run dev
```

You should see:
```
✅ MongoDB Atlas connected successfully
```

---

## 🆘 Still Having Issues?

1. Run the test script: `node test-mongo-connection.js`
2. Read the full guide: `MONGODB_TROUBLESHOOTING.md`
3. Check MongoDB Atlas status: https://status.mongodb.com/
4. Create an issue on GitHub with the error message

---

**Quick Links:**
- MongoDB Atlas: https://cloud.mongodb.com/
- Full Troubleshooting Guide: See MONGODB_TROUBLESHOOTING.md
- Backend README: See aurikrex-backend/README.md
