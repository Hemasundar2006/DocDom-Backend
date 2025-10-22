# Student Resource Hub - Architecture Documentation

## System Overview

The Student Resource Hub is a secure, multi-tenant file-sharing platform designed for educational institutions. Each college operates as an isolated tenant with strict data segregation enforced at the database level.

## Core Architecture Principles

### 1. Security-First Design
- **Zero Trust Model**: Every request must be authenticated and authorized
- **Defense in Depth**: Multiple layers of security (authentication, authorization, validation, access control)
- **Least Privilege**: Users can only access resources from their own college

### 2. Data Segmentation
- **College-Based Isolation**: All file queries include mandatory college filter
- **Reference Integrity**: Mongoose relationships ensure data consistency
- **Indexed Access Control**: Database indexes on college field for performance

### 3. Stateless Authentication
- **JWT Tokens**: No server-side session storage
- **Scalable**: Can be deployed across multiple instances
- **Secure**: Tokens contain minimal information (just user ID)

## Database Schema Design

### Entity Relationship Diagram

```
┌─────────────┐
│   College   │
│─────────────│
│ _id         │◄──────────┐
│ name        │           │
│ domain      │           │
└─────────────┘           │
                          │ (Reference)
                          │
                 ┌────────┴────────┐
                 │                 │
         ┌───────┴──────┐   ┌─────┴──────┐
         │     User     │   │    File    │
         │──────────────│   │────────────│
         │ _id          │   │ _id        │
         │ name         │   │ college    │
         │ email        │   │ uploader   │──┐
         │ password     │   │ fileName   │  │
         │ college      │   │ semester   │  │
         └──────────────┘   │ course     │  │
                 │          │ ...        │  │
                 └──────────┼────────────┘  │
                            │               │
                            └───────────────┘
                              (Reference)
```

### Key Relationships

1. **College → User**: One-to-Many
   - Each user belongs to exactly one college
   - Email domain must match college domain

2. **College → File**: One-to-Many
   - Each file belongs to exactly one college
   - CRITICAL for access control

3. **User → File**: One-to-Many (as uploader)
   - Tracks who uploaded each file
   - Used for "my uploads" filtering

## Access Control Flow

### Registration Flow
```
1. User selects college from dropdown
2. User enters email (e.g., john@cec.ac.in)
3. Backend validates email domain against college.domain
4. If valid, create user with college reference
5. Return JWT token containing user._id
```

### File Upload Flow
```
1. Authenticated user uploads file with metadata
2. Backend extracts college ID from req.user (from JWT)
3. File record created with:
   - college: user.college._id (AUTOMATIC)
   - uploader: user._id
   - Other metadata
4. File saved with college association
```

### File Retrieval Flow
```
1. Authenticated user requests files
2. Backend builds query:
   query = { college: req.user.college._id }  // MANDATORY
3. Apply optional filters (semester, course, etc.)
4. Only returns files matching user's college
5. User CANNOT access files from other colleges
```

### Access Control Enforcement Points

```
Request → JWT Validation → Extract User → Get College ID
                             ↓
              Database Query with College Filter
                             ↓
                    Return Only User's College Files
```

## Security Layers

### Layer 1: Authentication (middleware/auth.js)
- Validates JWT token
- Extracts user ID
- Loads user with college information
- Attaches to req.user

### Layer 2: Authorization (route level)
- All file routes require authentication
- No public file access

### Layer 3: Data Access Control (query level)
- Every file query MUST include college filter
- Enforced in code, not optional

### Layer 4: Input Validation (express-validator)
- Validates all user inputs
- Sanitizes data
- Prevents injection attacks

### Layer 5: File Validation (multer)
- File type whitelist
- Size limits
- Unique naming

## API Design Patterns

### RESTful Resource Naming
```
/api/colleges          - College resources
/api/register          - User registration
/api/login             - User authentication
/api/user/me           - Current user profile
/api/files             - File collection
/api/files/:id         - Individual file
```

### Consistent Response Format
```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": { ... },
  "errors": [ ... ]  // For validation errors
}
```

### HTTP Status Codes
- 200: Success (GET, PUT)
- 201: Created (POST)
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (access denied)
- 404: Not Found
- 500: Server Error

## Performance Optimizations

### Database Indexes
```javascript
// College Model
collegeSchema.index({ domain: 1 });

// User Model
userSchema.index({ email: 1 });
userSchema.index({ college: 1 });

// File Model (Most Critical)
fileSchema.index({ college: 1, semester: 1 });
fileSchema.index({ college: 1, course: 1 });
fileSchema.index({ college: 1, uploader: 1 });
fileSchema.index({ college: 1, uploadDate: -1 });
fileSchema.index({ fileName: 'text', description: 'text' });
```

### Query Optimization
- Compound indexes for common filter combinations
- Text indexes for search functionality
- Lean queries where full documents not needed
- Population with field selection

## Scalability Considerations

### Horizontal Scaling
- Stateless JWT authentication (no session affinity)
- No server-side session storage
- Can run multiple instances behind load balancer

### Database Scaling
- Indexed queries for fast access
- Could implement sharding by college
- Read replicas for analytics queries

### File Storage Scaling
- Currently local storage (development)
- Designed for cloud storage (S3/GCS)
- fileUrl field stores permanent link
- Decoupled from application servers

## Migration Path to Cloud Storage

### Current (Development)
```javascript
fileUrl: '/uploads/filename-123.pdf'
Storage: Local filesystem
```

### Future (Production)
```javascript
fileUrl: 'https://s3.amazonaws.com/bucket/college-id/file-id.pdf'
Storage: AWS S3 or Google Cloud Storage

Implementation Steps:
1. Install AWS SDK: npm install aws-sdk
2. Update config/multer.js to use multer-s3
3. Generate signed URLs for secure downloads
4. Implement file deletion on S3
5. Update fileUrl to store S3 URLs
```

## Error Handling Strategy

### Layers of Error Handling

1. **Input Validation**: express-validator catches bad inputs
2. **Route-level**: Try-catch blocks in route handlers
3. **Middleware**: Multer errors handled separately
4. **Global Handler**: Catches unhandled errors in server.js
5. **Process Level**: Unhandled promise rejection handler

### Error Response Consistency
All errors return:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

## Environment Configuration

### Development
- Local MongoDB
- Local file storage
- Verbose logging
- Short token expiry for testing

### Production
- MongoDB Atlas (cloud)
- AWS S3/GCS storage
- Production logging (Winston)
- Standard token expiry
- Rate limiting
- HTTPS only
- CORS configuration

## Testing Strategy

### Manual Testing
- API_EXAMPLES.http for REST Client
- QUICKSTART.md for command-line testing
- Postman for GUI testing

### Recommended Automated Tests
1. **Unit Tests**: Models, utilities
2. **Integration Tests**: API endpoints
3. **Security Tests**: Authentication, authorization
4. **Access Control Tests**: College segregation
5. **Load Tests**: Performance under load

### Test Coverage Goals
- Routes: 100%
- Models: 100%
- Middleware: 100%
- Access Control: 100%

## Deployment Architecture

### Recommended Production Setup
```
Internet
   ↓
Load Balancer (HTTPS)
   ↓
┌──────────────────────────┐
│  Application Servers     │
│  (PM2 Cluster Mode)      │
│  - Instance 1            │
│  - Instance 2            │
│  - Instance N            │
└──────────────────────────┘
   ↓                    ↓
MongoDB Atlas      AWS S3/GCS
(Database)         (File Storage)
```

## Monitoring and Logging

### Key Metrics to Monitor
- Request rate
- Response times
- Error rates
- Database connection pool
- File upload success/failure
- Authentication failures
- College-based usage statistics

### Logging Strategy
- Request/Response logging (Morgan)
- Error logging (Winston)
- Security events
- File operations
- Database queries (slow query log)

## Security Best Practices Implemented

✅ Password hashing with bcrypt
✅ JWT for stateless authentication
✅ Input validation and sanitization
✅ College-based access control
✅ Email domain validation
✅ File type validation
✅ File size limits
✅ Secure error messages (no sensitive info leakage)
✅ CORS configuration
✅ Environment variable for secrets

### Additional Recommendations for Production

- [ ] Rate limiting (express-rate-limit)
- [ ] Helmet.js for security headers
- [ ] HTTPS enforcement
- [ ] File virus scanning
- [ ] Request logging
- [ ] Audit trail for file access
- [ ] Account lockout after failed logins
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] File encryption at rest

## Conclusion

This architecture provides a solid foundation for a secure, scalable, multi-tenant file-sharing platform. The college-based access control is enforced at multiple levels, ensuring data segregation and security. The system is designed to scale horizontally and can easily migrate to cloud-based file storage.

