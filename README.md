# Project Management Form

A small project tracking form built with HTML, CSS, JavaScript, and JsonPowerDB. It checks each Project ID before enabling the form, then creates a new project or loads an existing one for editing.

## Table of contents

- [Features](#features)
- [Technology](#technology)
- [Database structure](#database-structure)
- [Run locally](#run-locally)
- [Benefits of JsonPowerDB](#benefits-of-jsonpowerdb)
- [Release history](#release-history)
- [Project status](#project-status)
- [Sources](#sources)

## Features

- Looks up projects by the `Project-ID` primary key.
- Enables Save for a new ID, or loads an existing record and enables Update.
- Requires all fields and checks that the deadline is not before the assignment date.
- Reset clears the form and restores its initial state.
- Uses a responsive layout for desktop and mobile screens.

## Technology

- HTML for the form structure
- CSS for layout and styling
- JavaScript for lookup, validation, and database operations
- JsonPowerDB REST API for project data

## Database structure

| JsonPowerDB item | Name |
| --- | --- |
| Database | `COLLEGE-DB` |
| Relation | `PROJECT-TABLE` |
| Primary key | `Project-ID` |

| Column | Form field |
| --- | --- |
| `Project-ID` | Project ID |
| `Project-Name` | Project name |
| `Assigned-To` | Assigned to |
| `Assignment-Date` | Assignment date |
| `Deadline` | Deadline |

## Run locally

1. Clone or download this repository and open the folder in VS Code.
2. Copy `config.example.js` to `config.js`.
3. In `config.js`, replace the placeholder with your JsonPowerDB connection token.
4. Open `index.html` using the VS Code Live Server extension.
5. Enter a Project ID. The form checks JsonPowerDB and enables the appropriate fields and buttons.

`config.js` is ignored by Git so your token is not included when you publish the source. The token is still sent to the browser when the app runs, so use a restricted or disposable token for coursework and do not host this client-only app publicly with a valuable token.

## Benefits of JsonPowerDB

- Provides a REST API that can be called directly from JavaScript.
- Stores JSON records without requiring a traditional server-side CRUD layer for this micro project.
- Supports indexed lookups and insert/update operations through its API.
- Keeps the example focused on the form and database workflow.

## Release history

- **1.0.0** — Initial Project Management micro project with JsonPowerDB lookup, save, update, and reset flow.

## Project status

Complete for the coursework scope. Requires a valid JsonPowerDB token and access to the configured database.

## Sources

- [JsonPowerDB API documentation](https://login2explore.com/jpdb/docs.html)
- [Login2Xplore](https://login2explore.com/)
- [GitHub: creating a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
