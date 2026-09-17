# InfoTally

> A full-stack student information management and synchronization
> platform designed to collect, organize, synchronize, and export
> structured student/class data from form-based sources such as Google
> Forms and Microsoft Forms.

![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)

------------------------------------------------------------------------

## Overview

**InfoTally** is a full-stack web application for collecting and
managing structured student and class information.

The platform provides project-based data management, authentication,
role-based access, form integrations, synchronized records, and local
data export.

The application uses a React frontend, Node.js/Express.js backend, and
MySQL database.

------------------------------------------------------------------------

# Features

## Frontend

-   Responsive web interface
-   Authentication and user sessions
-   Project-based workspace
-   Dynamic project columns
-   Student/class record management
-   Google integration
-   Microsoft integration
-   Microsoft Forms / OneDrive Excel synchronization
-   Synchronized data viewing
-   Excel export
-   PDF export
-   Project-level data management

------------------------------------------------------------------------

## Backend

-   RESTful API architecture
-   JWT-based authentication
-   Role-based access control
-   MySQL database integration
-   Project and record management
-   Dynamic columns and record values
-   Google OAuth integration
-   Microsoft OAuth integration
-   Microsoft Graph API integration
-   OneDrive Excel workbook discovery and synchronization
-   Email functionality through Nodemailer
-   Local Excel generation
-   Local PDF generation
-   Environment-variable configuration
-   Error handling and diagnostic utilities

------------------------------------------------------------------------

## Database

-   MySQL Community Server
-   Relational database architecture
-   Project management
-   Dynamic project columns
-   Project records
-   Record values
-   User management
-   Access requests
-   Activity logs
-   Project integrations

------------------------------------------------------------------------

# Integrations

## Google

Google OAuth is used for connecting a user's Google account and
accessing the configured Google integration workflow.

## Microsoft

Microsoft OAuth and Microsoft Graph API are used for Microsoft account
integration.

For personal Microsoft accounts, the application uses the OneDrive/Excel
workflow for Microsoft Forms response workbooks.

For supported Microsoft 365 work/school accounts, the application can
use the Microsoft Forms API workflow.

------------------------------------------------------------------------

# Data Export

InfoTally can export synchronized project data directly from the local
backend.

Supported formats:

-   Excel (`.xlsx`)
-   PDF (`.pdf`)

Exports are generated from the application's database and do not require
an additional cloud storage service.

------------------------------------------------------------------------

# Tech Stack

  Category                Technologies
  ----------------------- ------------------------------------
  Frontend                React, React Router, Axios
  Build Tool              Vite
  Styling                 Tailwind CSS
  Backend                 Node.js, Express.js
  Database                MySQL Community Server
  Database Tool           MySQL Workbench
  Authentication          JWT, Google OAuth, Microsoft OAuth
  Microsoft Integration   Microsoft Graph API, OneDrive
  Email                   Nodemailer / SMTP
  Excel Export            ExcelJS
  PDF Export              PDFKit
  Development             Git, GitHub, Visual Studio Code

------------------------------------------------------------------------

# Project Structure

``` text
InfoTally/
│
├── .git/
│
├── backend/
│   ├── node_modules/
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   ├── db.js
│   ├── diag_output.txt
│   ├── diag2.txt
│   ├── mailer.js
│   ├── microsoftRoutes.js
│   ├── package.json
│   ├── package-lock.json
│   ├── run_diagnose.js
│   └── server.js
│
├── frontend/
│   ├── dist/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   ├── .gitignore
│   ├── .oxlintrc
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── .gitignore
```

------------------------------------------------------------------------

# Installation

```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}Prerequisites`</strong>`{=html}
```{=html}
</summary>
```
Install the following software before setting up the project.

  Software                 Purpose
  ------------------------ ------------------------------
  Node.js                  Frontend and backend runtime
  Git                      Version control
  MySQL Community Server   Database
  MySQL Workbench          Database management
  Visual Studio Code       Development

```{=html}
</details>
```

------------------------------------------------------------------------

# Setup Instructions

## Clone the Repository

``` bash
git clone <repository-url>

cd InfoTally
```

------------------------------------------------------------------------

## Backend Setup

``` bash
cd backend

npm install

node server.js
```

The backend runs on:

``` text
http://localhost:5000
```

------------------------------------------------------------------------

## Frontend Setup

Open another terminal:

``` bash
cd frontend

npm install

npm run dev
```

The Vite development server will display the local frontend URL in the
terminal.

------------------------------------------------------------------------

# Database Setup

1.  Install **MySQL Community Server**.
2.  Open **MySQL Workbench**.
3.  Create the `InfoTally` database.
4.  Configure the database credentials in `backend/.env`.
5.  Start the backend.
6.  The backend initializes/checks the required application tables
    during startup.

------------------------------------------------------------------------

# Environment Variables

Create a `.env` file inside the `backend` directory.

``` env
# MySQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=InfoTally
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password

# SMTP Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@example.com
SMTP_PASSWORD=your_smtp_app_password

# JSON Web Token Secret
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000

# Administrator Bootstrap Configuration
ADMIN_NAME=InfoTallyAdmin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_password

# Google OAuth Integration (Phase 1)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/integrations/google/callback

# Microsoft OAuth Integration (OneDrive Excel Workbook Sync)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/integrations/microsoft/callback
```

**Never commit the real `.env` file or OAuth/client secrets to GitHub.**

------------------------------------------------------------------------

# Available Scripts

## Frontend

  Command           Description
  ----------------- ------------------------------------
  `npm install`     Installs frontend dependencies
  `npm run dev`     Starts the Vite development server
  `npm run build`   Creates a production build

## Backend

  Command            Description
  ------------------ -------------------------------
  `npm install`      Installs backend dependencies
  `node server.js`   Starts the backend server

------------------------------------------------------------------------

# Authentication

InfoTally uses JWT-based authentication for application users.

External account integrations use OAuth:

-   Google OAuth
-   Microsoft OAuth

OAuth credentials and secrets are stored through environment variables
rather than being hard-coded into the application.

------------------------------------------------------------------------

# Microsoft Forms Integration

InfoTally supports two Microsoft account scenarios:

``` text
Microsoft Account
       │
       ├── Personal Microsoft Account (MSA)
       │        │
       │        └── OneDrive → Microsoft Forms Excel Workbook
       │
       └── Microsoft 365 Work/School Account
                │
                └── Microsoft Forms API
```

The Microsoft integration is designed to preserve the existing Excel
synchronization workflow for personal Microsoft accounts while allowing
the native Forms API workflow for supported Microsoft 365 accounts.

------------------------------------------------------------------------

# Data Persistence

Synchronized project information is stored in the InfoTally MySQL
database.

Previously synchronized information is intended to remain available
independently of the user's current OAuth session.

External integrations are used to retrieve/synchronize data; the
application's database is used to retain project records after
synchronization.

------------------------------------------------------------------------

# Security Considerations

-   OAuth client secrets are stored in environment variables.
-   JWT authentication protects application APIs.
-   Access to project data is authorization-controlled.
-   External OAuth access tokens should not be exposed to the frontend.
-   Database credentials should never be committed to source control.
-   `.env` should remain excluded through `.gitignore`.
-   Export endpoints require authenticated access.

------------------------------------------------------------------------

# Future Improvements

-   Advanced data analytics
-   More form-provider integrations
-   Improved synchronization scheduling
-   Advanced project permissions
-   More export formats
-   Enhanced audit and activity reporting
-   Production deployment configuration

------------------------------------------------------------------------

# Contributors

  Name              Role
  ----------------- -----------
  Dipayan Samanta   Developer

------------------------------------------------------------------------

# Language Distribution

``` mermaid
pie title Project Language Distribution
    "JavaScript / JSX" : 100
```

------------------------------------------------------------------------

## License

Apache License 2.0
