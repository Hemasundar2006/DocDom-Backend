# Quick Start Guide

## Setup in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env` file in the root directory with:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/student-resource-hub
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### 3. Start MongoDB
```bash
# macOS/Linux
sudo systemctl start mongod

# Windows (if installed as service)
net start MongoDB

# Or run manually
mongod
```

### 4. Seed Database
```bash
npm run seed
```

Expected output:
```
MongoDB Connected for seeding...
Cleared existing colleges
✓ Successfully seeded 10 colleges

Seeded Colleges:
1. College of Engineering Chengannur (@cec.ac.in)
2. National Institute of Technology Calicut (@nitc.ac.in)
...
```

### 5. Start Server
```bash
npm run dev
```

Expected output:
```
MongoDB Connected: localhost
Database: student-resource-hub
Server running in development mode on port 5000
Health check: http://localhost:5000/health
```

## Test the API

### 1. Check Health
```bash
curl http://localhost:5000/health
```

### 2. Get Colleges
```bash
curl http://localhost:5000/api/colleges
```

### 3. Register a User
```bash
# First, get a college ID from step 2
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@cec.ac.in",
    "password": "test123",
    "collegeId": "PASTE_COLLEGE_ID_HERE"
  }'
```

Save the `token` from the response!

### 4. Get Your Profile
```bash
curl http://localhost:5000/api/user/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Upload a File
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/your/file.pdf" \
  -F "semester=3" \
  -F "course=Mathematics" \
  -F "description=Test file upload"
```

### 6. List Files
```bash
# All files from your college
curl http://localhost:5000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Filter by semester
curl "http://localhost:5000/api/files?semester=3" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Your uploads only
curl "http://localhost:5000/api/files?myuploads=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Search files
curl "http://localhost:5000/api/files?search_term=mathematics" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Common Issues

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running. Start it with `mongod` or `sudo systemctl start mongod`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change the `PORT` in `.env` file or kill the process using port 5000

### JWT Secret Warning
Always change the `JWT_SECRET` in production to a strong random string!

## What's Next?

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints
- Customize the college list in `scripts/seedColleges.js`
- Integrate with your frontend application

## API Flow Example

1. **Frontend** → GET `/api/colleges` → Display college dropdown
2. **User** → Selects college and fills registration form
3. **Frontend** → POST `/api/register` with email matching college domain
4. **Backend** → Validates, creates user, returns JWT token
5. **Frontend** → Stores token, makes authenticated requests
6. **User** → Uploads file with metadata
7. **Frontend** → POST `/api/files/upload` with token
8. **Backend** → Saves file, stores metadata with user's college ID
9. **Frontend** → GET `/api/files` → Only shows files from user's college
10. **User** → Can filter by semester, course, search, or view their uploads

## Security Notes

- ✅ All passwords are hashed with bcrypt
- ✅ JWT tokens expire in 7 days
- ✅ Users can only access files from their college
- ✅ Email domain validation prevents unauthorized access
- ✅ Input validation on all endpoints
- ✅ File type and size restrictions

Happy coding! 🚀

