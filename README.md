# Project Template

This is a project template with pre-configured Markdown linting.

## Structure

```
project-template/
├── .vscode/
│   └── settings.json          # VS Code workspace settings
├── .markdownlint.json         # Markdown linting rules
└── README.md                  # This file
```

## Setup

1. Copy this entire `project-template` folder to use as a starting point for new projects
2. Rename it to your project name
3. Make sure you have the **markdownlint** extension installed in VS Code
4. Open the project in VS Code and the linting rules will automatically apply

## Markdownlint Rules

The `.markdownlint.json` file includes common Markdown linting rules:

- **MD013**: Line length limit of 120 characters (configurable)
- **MD007**: List indentation of 2 spaces
- **MD024**: Allow duplicate heading names only if they're siblings
- **MD033**: Allow HTML (disabled by default, adjust as needed)
- **MD041**: Allow first line not to be H1

You can customize these rules by editing `.markdownlint.json`. See the [markdownlint documentation](https://github.com/DavidAnson/markdownlint) for all available rules.

## Notes

- The `.vscode` folder stores workspace-specific settings
- Hidden files (starting with `.`) may not be visible by default in your file explorer
- To view hidden files in VS Code: `Cmd+Shift+.` (Mac) or `Ctrl+Shift+.` (Windows)
