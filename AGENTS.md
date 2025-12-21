# Project Context for AI Agents

This file serves as the single source of truth for project context and state. All Experts should read this and update file when working on this project.

## CRITICAL

- Read GLOBAL-CODE-PREFERENCES.md first - This contains overarching principles that govern all work on this project:

## Quick navigation Entries

We always want to have these Documents for project

- Create GLOBAL-CODE-PREFERENCES.md from <https://github.com/jwilleke/mjs-project-template>
- [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Coding guidelines and conventions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Project structure and patterns
- [SECURITY.md](./SECURITY.md) - Security practices and guidelines
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development workflow
- [project_log.md](docs/project_log.md) - as a quick and historical record of work done on the project.

And some aucillary documents will be created intially or as the project progresses.

- [.github/workflows/README.md](.github/workflows/README.md) - CI/CD pipelines

## Context Overview

- Project Name: `$PROJECT_NAME` (from .env.example)
- Description: A brief description of what this project does and its primary purpose.
- Example Project (for reference):
  - Project Name: `user-auth-service`
  - Description: A secure authentication microservice that handles user registration, login, JWT token management, and password reset flows for distributed applications.

## Key Decisions

These maybe done intially or as the project progresses include "Decision and rationale"

## Architecture & Tech Stack

see [ARCHITECTURE.md](./ARCHITECTURE.md) and use primarly structure and headings.

## Coding Standards

see [CODE_STANDARDS.md](./CODE_STANDARDS.md) and use primarly structure and headings.

## Project Constrains

These maybe done intially or as the project progresses.

## Project Log

Always create docs/project_log.md file as a quick and historical record of work done on the project and Next Steps
docs/project_log.md should contain:

docs/project_log.md should use the following format

- yyyy-MM-dd
- Agent: [Claude/Gemini/Crush]
- Subject:
  - Current Issues
  - Work Done:
    - [Task 1]
    - [Task 2]
    - GitHub commit ID (If applicaable)
    - Files Modified: [file1.ext, file2.ext]

### TODO & Next Steps

in [project_log.md](docs/project_log.md) at the top keep a List of Next Steps ranked as:

- High Priority
- Medium Priority
- Low Priority

Remove as completed.

## Notes & Context

Add any additional notes, context, or information that agents should know here. Examples:

- Known blockers preventing progress
- External dependencies or services required
- Database schema or API contracts
- Team communication channels or review processes
- Performance benchmarks or SLA requirements

## Agent Guidelines

For All Agents

- Read GLOBAL-CODE-PREFERENCES at the top of
- Read this [AGENTS.md](./AGENTS.md) first before starting any work
- Update sections after completing tasks
- Note your session in the "Completed Work" section

Important: Keep this file synchronized and updated. This is the bridge between different experts working on the same project.
