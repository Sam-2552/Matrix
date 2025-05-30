# Next.js Authentication Project

This is a Next.js application with built-in authentication using NextAuth.js. The project includes both admin and regular user authentication flows.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 14.x or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd <your-project-directory>
```

2. Install dependencies:
```bash
npm install
```

## Development

To run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Authentication

### Registration
- Visit `/register` to create a new account
- Fill in your name, email, and password
- After successful registration, you'll be redirected to the login page

### Default Login Credentials

The application comes with two default accounts for testing:

#### Admin Account
- Email: admin@example.com
- Password: admin@password123

#### Regular User Account
- Email: user@example.com
- Password: password

## Features

- Next.js authentication using NextAuth.js
- JWT-based session management
- Role-based access control (Admin and Regular User roles)
- Custom login and registration pages
- Secure password handling

## Project Structure

- `/src/pages/api/auth` - Authentication API routes
- `/src/lib/auth` - Authentication utilities
- `/src/pages` - Next.js pages including login and registration
- `/src/app` - Next.js app directory with pages and components

## Security Notes

- The default accounts are for development purposes only
- In production, make sure to:
  - Remove hardcoded credentials
  - Use environment variables for sensitive data
  - Implement proper password hashing
  - Set up proper database integration

## License

[Your License Here]
