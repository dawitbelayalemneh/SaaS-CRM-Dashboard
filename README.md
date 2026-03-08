# SalesPulse CRM

A modern, full-featured Customer Relationship Management dashboard built with React, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** — Overview of key metrics (total leads, active deals, revenue, conversion rate) with interactive charts
- **Leads Management** — Track and manage sales leads with status tracking (New → Contacted → Qualified → Lost)
- **Contacts** — Store and organize customer contact information, company details, and notes
- **Deals Pipeline** — Kanban-style deal tracking across stages: Prospecting, Qualification, Proposal, Negotiation, Won, and Lost
- **Activity Timeline** — Automatic logging of all CRM actions for full audit history
- **Admin Panel** — Role-based user management (Admin / Team Member)
- **Settings** — Update your profile, company info, and preferences

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Usage Guide

### 1. Sign Up & Log In

Create an account on the signup page. Verify your email, then log in. The first user is automatically assigned the **Admin** role.

### 2. Dashboard

After logging in you land on the Dashboard, which displays:

| Card | Description |
|------|-------------|
| Total Leads | Count of all leads in the system |
| Active Deals | Deals not yet won or lost |
| Revenue | Sum of all won deal values |
| Conversion Rate | Percentage of leads converted to deals |

Charts show monthly revenue trends and deal stage distribution.

### 3. Managing Leads

Navigate to **Leads** from the sidebar.

- Click **Add Lead** to create a new lead with name, email, phone, company, source, and status
- Edit or delete leads using the action buttons on each row
- Filter by status to focus on specific pipeline stages

### 4. Managing Contacts

Navigate to **Contacts** from the sidebar.

- Click **Add Contact** to store a contact's details (name, email, phone, company, job title, notes)
- Edit or delete contacts as needed
- Contacts can be linked to deals for relationship tracking

### 5. Deals Pipeline

Navigate to **Deals** from the sidebar.

- **Desktop**: Drag and drop deal cards between stage columns (Prospecting → Won)
- **Mobile**: Use the stage filter chips to view deals by stage
- Click **Add Deal** to create a new deal with title, value, stage, expected close date, and linked contact
- Edit or delete deals from the card actions

### 6. Admin — User Management

Navigate to **Admin Users** from the sidebar (visible to admins only).

- View all registered users and their roles
- Assign roles: **Admin** or **Team Member**

### 7. Settings

Navigate to **Settings** to update:

- Full name, phone, job title, and company
- Profile avatar URL

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (database, auth, real-time)
- **Charts**: Recharts
- **Drag & Drop**: @hello-pangea/dnd
- **Routing**: React Router v6

## Responsive Design

The app is fully responsive:

- Tables convert to card layouts on mobile
- The deals Kanban switches to a filterable list view
- Sidebar collapses into a sheet overlay
- Forms stack vertically on small screens

## License

Private — All rights reserved.
