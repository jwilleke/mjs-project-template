# Project Context for AI Agents

This file serves as the single source of truth for project context and state. Both Claude and Gemini should read this file first when working on this project.

**Quick navigation:**

- [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Coding guidelines and conventions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Project structure and patterns
- [SECURITY.md](./SECURITY.md) - Security practices and guidelines
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development workflow
- [.github/workflows/README.md](.github/workflows/README.md) - CI/CD pipelines

## Project Overview

**Project Name:** `$PROJECT_NAME` (from .env.example)

**Description:** A brief description of what this project does and its primary purpose.

**Example Project (for reference):**

**Project Name:** `user-auth-service`

**Description:** A secure authentication microservice that handles user registration, login, JWT token management, and password reset flows for distributed applications.

**Goals:**

- Implement secure JWT-based authentication with refresh token rotation
- Provide REST API endpoints for user registration, login, and token refresh
- Integrate with PostgreSQL for user data persistence and audit logging
- Support OAuth2 integration for third-party authentication providers

## Current Status

- Overall Progress: 30% complete
- Last Updated: 2024-12-02
- Updated By: Template Setup

**Example Status (for reference):**

- Overall Progress: 65% complete - Core authentication working, OAuth integration in progress
- Last Updated: 2024-12-01
- Updated By: Claude

## Architecture & Tech Stack

see [ARCHITECTURE.md](./ARCHITECTURE.md)

## Coding Standards

see [CODE_STANDARDS.md](./CODE_STANDARDS.md)

### Key Technologies

- Node.js with TypeScript
- Express.js for REST API
- PostgreSQL for data persistence
- JWT for authentication

**Example Stack (for reference):**

- Node.js v18+ with TypeScript (strict mode)
- Express.js for REST API endpoints
- PostgreSQL 15+ with Prisma ORM
- Redis for session/token caching
- Jest for unit testing
- Docker for containerization

## Project Log

Always create project_log.md file as a log of work done on the project in format

- yyyy-MM-dd
- Agent: [Claude/Gemini/Crush]
- Subject:
  - Key Decision
  - Current Issues
  - Work Done:
    - [Task 1]
    - [Task 2]
    - GitHub commit ID (If applicaable)
    - Files Modified: [file1.ext, file2.ext]

## TODO & Next Steps

### High Priority

- [ ] Fill out Project Overview, Description, and Goals in AGENTS.md with your specific project details
- [ ] Update .env.example with required environment variables for your project
- [ ] Create initial source files in src/ directory following ARCHITECTURE.md structure

**Example High Priority (for reference):**

- [ ] Implement OAuth2 Google integration for sign-up flow
- [ ] Add password strength validation and hashing with bcrypt
- [ ] Create integration tests for login endpoint

### Medium Priority

- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Add monitoring and error logging (Sentry/LogRocket)
- [ ] Document API endpoints with OpenAPI/Swagger

**Example Medium Priority (for reference):**

- [ ] Implement rate limiting on authentication endpoints
- [ ] Add email verification flow for new registrations
- [ ] Create admin dashboard for user management

### Low Priority

- [ ] Performance optimization and caching strategy
- [ ] Add analytics for authentication metrics
- [ ] Create video tutorial for API usage

**Example Low Priority (for reference):**

- [ ] Support SAML authentication provider
- [ ] Add biometric authentication option
- [ ] Create mobile SDK wrapper for authentication

## Notes & Context

Add any additional notes, context, or information that agents should know here. Examples:

- Known blockers preventing progress
- External dependencies or services required
- Database schema or API contracts
- Team communication channels or review processes
- Performance benchmarks or SLA requirements

## Agent Guidelines

For All Agents

- Read [GLOBAL-CODE-PREFERENCES](~/GLOBAL-CODE-PREFERENCES.md)
- Read this [AGENTS.md](./AGENTS.md) first before starting any work
- Update sections after completing tasks
- Note your session in the "Completed Work" section

Important: Keep this file synchronized and updated. It's the bridge between different agents working on the same project.
