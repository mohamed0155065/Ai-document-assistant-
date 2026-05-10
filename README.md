# AI Document Assistant

AI-powered full-stack document analysis platform that allows users to create projects, upload multiple files, extract text content, and interact with AI using custom prompts.

Users can organize documents into isolated workspaces, analyze multiple files together, and store AI-generated responses with persistent prompt history.

---

## Live Demo

[https://ai-document-assistant-kappa.vercel.app/](https://ai-document-assistant-kappa.vercel.app/)

---

## GitHub Repository

[https://github.com/mohamed0155065/Ai-document-assistant-](https://github.com/mohamed0155065/Ai-document-assistant-)

---

# Features

* Multi-file document upload
* AI-powered document analysis
* Project-based workspace organization
* Drag & Drop file uploads
* Browse files support
* File removal support
* Prompt-based AI interactions
* Persistent analysis history
* Responsive dashboard UI
* Authentication and protected routes
* Supabase cloud storage integration
* Clean and reusable architecture

---

# Supported File Types

* PDF
* DOCX
* TXT

Maximum upload size:

* 5MB per file

---

# Application Workflow

```txt
User Authentication
        ↓
Create Project
(name + description)
        ↓
Store project in Supabase Database
        ↓
Upload files to Supabase Storage
        ↓
Extract text from uploaded files
(PDF / DOCX / TXT)
        ↓
Create combined project context
        ↓
User submits AI prompt
        ↓
Send:
- extracted text context
- user prompt
to Grok AI
        ↓
Receive AI response
        ↓
Store prompt + response in generations
        ↓
Render analysis history
```

---

# Architecture Highlights

## Separation of Concerns

The application separates responsibilities into independent layers:

* Upload handling
* Storage management
* Text extraction
* Context generation
* AI processing
* Database persistence
* UI rendering

This architecture improves:

* maintainability
* scalability
* reusability
* readability

---

# File Processing System

## Text Extraction Pipeline

Uploaded files are converted into plain text before being sent to AI.

### TXT Processing

```ts
buffer.toString("utf-8")
```

### PDF Processing

Uses:

* pdf2json

To parse PDF pages and extract readable text.

### DOCX Processing

Uses:

* mammoth

To extract raw text content from Word documents.

---

# Database Design

## Tables

### projects

Stores:

* project name
* description
* user ownership

### documents

Stores:

* uploaded files
* extracted document metadata
* project relation

### generations

Stores:

* prompts
* AI responses
* analysis history
* timestamps

---

# Tech Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS

## Backend / Services

* Supabase
* Grok AI API

## File Processing

* pdf2json
* mammoth

## Storage

* Supabase Storage

## Authentication

* Supabase Auth

---

# Engineering Concepts Demonstrated

* AI Document Processing
* Multi-document Context Aggregation
* Full-stack Architecture
* Cloud Storage Integration
* File Parsing Pipelines
* Authentication & Authorization
* Reusable Component Architecture
* Project-based Data Isolation
* Async File Processing
* Persistent AI Workflows

---

# Project Structure

```txt
app/
components/
lib/
types/
utils/
```

---

# Installation

## Clone the repository

```bash
git clone https://github.com/mohamed0155065/Ai-document-assistant-.git
```

## Navigate to the project

```bash
cd Ai-document-assistant-
```

## Install dependencies

```bash
npm install
```

## Create environment variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
XAI_API_KEY=
```

## Run the development server

```bash
npm run dev
```

---

# Future Improvements

* Streaming AI responses
* Markdown rendering
* AI chat interface
* Vector search integration
* Export analysis as PDF/DOCX
* File preview support
* AI prompt templates

---

# Author

Mohamed Elboraei
