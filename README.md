# Student Resource Hub Backend

A secure, college-based resource sharing platform built with Node.js, Express.js, and MongoDB. Features JWT authentication, college-based access control, and file management capabilities.

## 🚀 Features

- **Secure Authentication**: JWT-based stateless authentication with bcrypt password hashing
- **College-Based Access Control**: Users can only access resources from their own college
- **File Management**: Upload, browse, and download educational resources
- **Advanced Filtering**: Search by semester, course, uploader, and search terms
- **Email Domain Validation**: Ensures users register with their official college email
- **RESTful API**: Clean, well-documented API endpoints

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd student-resource-hub-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory (use `env.example.txt` as reference):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/student-resource-hub
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or if using MongoDB as a service
   sudo systemctl start mongod
   ```

5. **Seed the database with colleges**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
student-resource-hub-backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── multer.js          # File upload configuration
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── models/
│   ├── College.js         # College model
│   ├── User.js            # User model with bcrypt
│   └── File.js            # File metadata model
├── routes/
│   ├── auth.js            # Authentication routes
│   └── files.js           # File management routes
├── scripts/
│   └── seedColleges.js    # Database seeding script
├── uploads/               # Temporary file storage (create automatically)
├── .env                   # Environment variables (create this)
├── .gitignore
├── package.json
├── server.js              # Main application entry point
└── README.md
```

## 🔐 API Endpoints

### Authentication Routes

#### 1. Get All Colleges
```http
GET /api/colleges
```
**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "name": "College of Engineering Chengannur"
    }
  ]
}
```

#### 2. Register User
```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@cec.ac.in",
  "password": "password123",
  "collegeId": "college_object_id"
}
```
**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@cec.ac.in",
    "college": "College of Engineering Chengannur",
    "token": "jwt_token_here"
  }
}
```

#### 3. Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "john@cec.ac.in",
  "password": "password123"
}
```

#### 4. Get Current User Profile
```http
GET /api/user/me
Authorization: Bearer <jwt_token>
```

### File Management Routes

#### 5. Upload File
```http
POST /api/files/upload
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "file": <file_binary>,
  "semester": "3",
  "course": "Data Structures",
  "description": "Lab manual for DSA"
}
```

**Supported File Types:**
- PDF, DOC, DOCX
- PPT, PPTX
- XLS, XLSX
- TXT
- Images (JPEG, PNG, GIF)
- ZIP

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "_id": "...",
    "fileName": "lab-manual.pdf",
    "semester": "3",
    "course": "Data Structures",
    "fileUrl": "/uploads/lab-manual-1234567890.pdf",
    "fileSize": 2048576,
    "uploadDate": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 6. Get Files (with filters)
```http
GET /api/files?semester=3&course=Data%20Structures&search_term=manual&myuploads=true
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `semester` (optional): Filter by semester (1-8)
- `course` (optional): Filter by course name (case-insensitive)
- `search_term` (optional): Search in file names and descriptions
- `myuploads` (optional): `true` to show only user's uploads

**Response:**
```json
{
  "success": true,
  "count": 5,
  "filters": {
    "college": "College of Engineering Chengannur",
    "semester": "3",
    "course": "Data Structures",
    "myUploads": true,
    "searchTerm": "manual"
  },
  "data": [...]
}
```

#### 7. Get Single File
```http
GET /api/files/:id
Authorization: Bearer <jwt_token>
```

## 🔒 Security Features

### 1. **JWT Authentication**
- Stateless authentication using JSON Web Tokens
- Tokens expire after 7 days (configurable)
- Protected routes require valid JWT in Authorization header

### 2. **Password Security**
- Passwords hashed using bcrypt with salt rounds of 10
- Passwords never returned in API responses

### 3. **College-Based Access Control**
- Users can ONLY access files from their own college
- Email domain validation during registration
- Every file query includes mandatory college filter

### 4. **Input Validation**
- Express-validator for all inputs
- Sanitization and normalization
- Type checking and constraints

### 5. **File Upload Security**
- File type validation (whitelist approach)
- File size limits (10MB default)
- Unique file naming to prevent overwrites

## 🎯 Database Schema

### College Model
```javascript
{
  name: String (unique),
  domain: String (unique, lowercase),
  timestamps: true
}
```

### User Model
```javascript
{
  name: String,
  email: String (unique, lowercase),
  password: String (hashed),
  college: ObjectId (ref: College),
  timestamps: true
}
```

### File Model
```javascript
{
  college: ObjectId (ref: College),
  uploader: ObjectId (ref: User),
  fileName: String,
  semester: String (1-8),
  course: String,
  description: String,
  fileUrl: String,
  fileType: String,
  fileSize: Number,
  uploadDate: Date,
  timestamps: true
}
```

## 📝 Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@cec.ac.in",
    "password": "password123",
    "collegeId": "your_college_id"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@cec.ac.in",
    "password": "password123"
  }'
```

**Upload File:**
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "semester=3" \
  -F "course=Data Structures" \
  -F "description=Lab manual"
```

### Using Postman

1. Import the endpoints into Postman
2. For protected routes, add Authorization header:
   - Type: Bearer Token
   - Token: `<your_jwt_token>`

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGO_URI=
JWT_SECRET=use_a_very_strong_random_secret_here
JWT_EXPIRE=7d
MAX_FILE_SIZE=10485760
```

### Cloud Storage Integration (Future)
Replace local file storage with AWS S3 or Google Cloud Storage:
1. Install AWS SDK: `npm install aws-sdk`
2. Update `config/multer.js` to use S3
3. Store S3 URLs in `fileUrl` field

### Recommended Production Practices
- Use MongoDB Atlas for database hosting
- Implement rate limiting (express-rate-limit)
- Add request logging (morgan)
- Use PM2 for process management
- Set up HTTPS/SSL
- Implement file virus scanning
- Add comprehensive error logging (Winston)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

ISC

## 👥 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ for students, by developers**

