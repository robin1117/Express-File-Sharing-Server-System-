# File Magenement Backend

This is Loader a fileManagement system where users can Register, Login, Create Folder, Rename file, upload files means user can manage there files/data securely with authentication this is for what our FileManagement System is.

---

## 🛠️ Tech Stack

- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB / Mongoose
- **Caching & Session:** Redis
- **Cloud Storage:** AWS S3
- **Authentication:** JWT / OAuth 2.0 / cookie-parser
- **Validation:** Zod 

---

## ✨ Key Features

- 🔐 **Authentication:** Secure user registration, login, using signed Cookies and session handling.
- 📁 **File Management:** Upload, rename, delete, and download files using `AWS S3`.
- ⚡ **Caching:** Fast session retrieval and data caching using `Redis`.
- 🛡️ **Data Validation:** Strict API request validation before processing.
- 📧 **Notifications:** Otp Verification and Password Reset functionality using `Resend` for Developers

---

## 💻 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18+)
- **npm** or **yarn**
- **Database** (MongoDB :replicaset for sotring document data and handling transactions)
- **Redis Server** (for managing login session)

## 📂 Folder Structure

```text
GTA-backend/
├── 📁 config/                       # Configuration for Database, Redis & AWS S3
│   ├── 📁 redisConfgControl/        # Redis configuration & setup handlers
│   ├── db.js                        # MongoDB connection setup
│   ├── s3Config.js                  # AWS S3 client setup
│   └── setup.js                     # General environment setup
├── 📁 Controllers/                  # Request handlers & core API logic
│   ├── authControllers.js           # Handles signup, login, Google OAuth, & logout
│   ├── directoryController.js       # Directory/Folder CRUD operations
│   ├── fileControllers.js           # File upload, download, rename, & delete handlers
│   └── userController.js            # User profile management
├── 📁 middlewares/                  # Express Custom Middlewares
│   ├── 📁 uploadingMiddleWares/     # Multer file upload configurations
│   ├── authMiddlewares.js           # Authentication & session checks
│   └── validateMiddleware.js        # Request payload validation middleware
├── 📁 models/                       # Mongoose Database Schemas
│   ├── directoryModel.js            # Folder/Directory structure schema
│   ├── fileModel.js                 # Uploaded file metadata schema
│   ├── otpModel.js                  # OTP validation schema
│   ├── passwordResetTokenModel.js   # Password reset tokens schema
│   ├── sessionModel.js              # Active user session schema
│   └── userModel.js                 # User credentials & profile schema
├── 📁 New_Learnings_from Project/   # Internal documentation & code reference snippets
├── 📁 routes/                       # REST API Route Declarations
│   ├── authRouter.js                # Auth endpoints (/login, /register, /oauth)
│   ├── directoryRoute.js            # Folder endpoints (/folders, /mkdir)
│   ├── fileRoutes.js                # File endpoints (/upload, /download, /delete)
│   └── userRoutes.js                # User profile endpoints
├── 📁 Services Auth/                # Service layer authentication helpers
│   └── authCodesService.js          # Auth code verification service
├── 📁 storage/                      # Temporary storage & local file processing
├── 📁 util/                         # Utility & Helper Functions
│   ├── directoryControllersUtils.js # Helper functions for directory handling
│   ├── LoginSessionHandler.js       # Session creation & Redis handlers
│   ├── sendOtp.js                   # Email OTP delivery utility
│   └── sendPasswordResetUrl.js      # Password reset link dispatcher
├── 📁 validators/                   # Input validation schemas (Zod schemas)
├── .env                             # Environment variables (Git-ignored)
├── envInjector.js                  # Environment variable injector script
├── express.js                       # Express app entry point & route registration
└── package.json                     # Project dependencies & scripts
```

```.env
#General connection
MONGO_DB_URL=mongodb://dbAdminUser:user1@localhost:27017/storageApp

#Config
SECRET_KEY_COOKI_PARSER=mynameisrobin149763
CLIENT_ORIGIN_URL=http://localhost:5500
PORT=5000

#Auth
YOUR_GOOGLE_CLIENT_SECRET=VOCGPX-iUdc_7NVhY1Yfz_zIylseRc008zg
YOUR_GOOGLE_CLIENT_ID=475216737217-mv8trlpu0q9qliqnp29kbjne3iupulva.apps.googleusercontent.com
YOUR_GOOGLE_REDIRECT_URI=http://localhost:5500
git_client_Secrete=eF8f9ac440d7a4256eea87a37712f564bd9eb742
git_client_id=Ov15LibALxbcKvmBJaIP
git_redirect_uri=http://localhost:5500/gitcallback
RESEND_API_KEY=re_jVdt3gOF_N5J512HTh6WKT4pb8UMRdkFA

#S3_Bucket
AWS_BUCKET_NAME=loaderbucket-686831565893-ap-south-1-an
YOUR_ACCESS_KEY=AKIAY89SZ7RCYROGBOAV
YOUR_SECRET_KEY=aZSRYz+hb+e+PRNIFVXw6UOAFO5+t1Moprk2DnIN
YOUR_REGION=ap-south-1

#Reset_PassWord_forget_pass
TTL_Time_Token=1800
```
### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
   ```