# API Keys Setup Guide

## 🔐 Security Notice
**Never commit actual API keys to version control!** This repository uses placeholder values for security.

## Setup Instructions

### 1. Environment File Setup
```bash
# Copy the example environment file
cp .env.example .env
```

### 2. Configure API Keys

Edit your `.env` file and replace the placeholder values:

```env
# Database Configuration (update with your database credentials)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gearguard
DB_USER=your_database_user
DB_PASSWORD=your_secure_database_password

# JWT Configuration (generate a secure secret)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_minimum_32_characters

# AI Assistant Configuration
GROQ_API_KEY=your_actual_groq_api_key_here
```

### 3. Get Your Groq API Key

1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up or log in to your account
3. Create a new API key
4. Copy the key and paste it in your `.env` file

### 4. Verify Setup

The AI Assistant feature will only work with a valid Groq API key. If you don't need AI features, you can leave the placeholder value.

## 🚨 Important Security Tips

- ✅ The `.env` file is already in `.gitignore`
- ✅ Never share your actual API keys
- ✅ Use different API keys for development and production
- ✅ Rotate your API keys regularly
- ❌ Never commit `.env` files with real credentials
- ❌ Never put API keys in documentation or code comments

## Troubleshooting

If you see errors related to API keys:
1. Check that your `.env` file exists
2. Verify the API key is correctly formatted
3. Ensure there are no extra spaces or quotes around the key
4. Test the API key in the Groq console first