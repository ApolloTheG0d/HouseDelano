# CSC 317 — Group Project Repository

Collectivised Writeup: https://docs.google.com/document/d/15rWkGh0LVsyGuU9s2_C_NyApe7N8JDoXZIott7T6etk/edit?usp=sharing

**Milestones 2–4**

This repository will be used for **Group Project Milestones 2, 3, and 4**.
You have already completed **Milestone 1 (Site Design)** — now it’s time to begin implementing your design into the foundation of a working site.

---

## Project Goal — Full‑Stack Scope

Across all milestones, your project (ecommerce site, chatbot, data visualization/dashboard, etc.) must demonstrate a **full‑stack** implementation:

* **Front‑End:** HTML, CSS, and Front‑End JavaScript for the UI.
* **Back‑End:** Ubuntu VM running Node.js/Express with a PostgreSQL database.
* **State & Auth:** Active authentication against the database, session/state management, and data retrieval/manipulation that is presented in the UI.

Milestone 2 focuses on front‑end structure and minimal interactivity; Milestones 3 and 4 complete the back‑end, auth, database, and full functionality.

---

## ⚡ Quick Start

```bash
# One-command setup (recommended)
npm run setup

# Then start the server
npm start
```

For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md)

---

## Setup Instructions

### 1. **Repository Setup**
Only **one** team member should accept the GitHub Classroom assignment link.
That person will own the team repository and should **add all other teammates as collaborators** under **Settings → Collaborators**.

### 2. **System Prerequisites**

Your website runs on a **Node.js + Express** server with a **PostgreSQL** database in your **Ubuntu 24.04 VM**.

**Check if PostgreSQL is installed:**
```bash
psql --version
# Should output: psql (PostgreSQL) 16.x or higher
```

**If not installed:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgresql-client
```

**Verify PostgreSQL is running:**
```bash
sudo systemctl status postgresql
# Should show: Active: active (running)
```

### 3. **Project Setup (First Time Only)**

```bash
# Clone the repository
git clone <your-repo-url>
cd group-project-ApolloTheG0d

# Install dependencies
npm install

# Create database user and database
sudo -u postgres createuser -d pawsco_user
sudo -u postgres psql -c "ALTER USER pawsco_user WITH PASSWORD 'password_123';"
sudo -u postgres createdb -O pawsco_user pawsco_dev

# Initialize database with schema
npm run db:migrate
```

### 4. **Running the Server**

```bash
# Start the server
npm start

# Server will run on: http://localhost:3001
```

**Server output should show:**
```
🐾 Paws & Company - Server Started 🐾

📍 Local Access:
   🌐 http://localhost:3001
   🌐 http://127.0.0.1:3001

📊 Server Configuration:
   Host:        localhost
   Port:        3001
   Environment: development
```

### 5. **Development with Auto-Reload**

```bash
# Run with nodemon (auto-reloads on file changes)
npm run dev
```

### 6. **Database Commands**

```bash
# Access database shell
npm run db:shell

# Reset database to initial state
npm run db:migrate

# Check database health
npm run db:diagnose
```

---

## 📖 Docker Alternative

This project **no longer uses Docker**. We switched to local PostgreSQL for simplicity and better team compatibility.

**For details on the Docker removal and setup changes, see:** [`huyedit.md`](./huyedit.md)

---

## Database Credentials

**Default Admin Account:**
```
Email:    admin@pawsco.com
Password: password_123
```

**Database Connection:**
```
Host:     127.0.0.1 (localhost)
Port:     5432
Database: pawsco_dev
User:     pawsco_user
Password: password_123
```

> ⚠️ **Change these credentials in production!**

---

## Project Structure

```
group-project-ApolloTheG0d/
├── bin/
│   └── www                 # Server startup script
├── db/
│   ├── schema.sql          # Database schema
│   ├── seed.js             # Database initialization
│   ├── pool.js             # Database connection pool
│   └── auth.js             # Authentication logic
├── middleware/
│   └── authMiddleware.js   # Auth verification
├── public/                 # Static files (HTML, CSS, images, JS)
│   ├── index.html
│   ├── stylesheets/
│   │   └── main.css
│   ├── scripts/
│   │   ├── main.js
│   │   ├── auth.js
│   │   └── navigation.js
│   └── images/
├── routes/                 # API routes
│   ├── index.js
│   ├── auth.js
│   ├── users.js
│   ├── bookings.js
│   ├── account.js
│   └── admin.js
├── views/                  # EJS templates
│   ├── layout.ejs
│   ├── header.ejs
│   └── ...other pages
├── .env                    # Environment variables (create if missing)
├── app.js                  # Express app setup
├── package.json            # Dependencies & scripts
└── README.md               # This file
```

---

## Troubleshooting

### "Cannot find module 'pg'"
```bash
npm install
```

### "Connection refused" / "Database unavailable"
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql
```

### "Role 'pawsco_user' does not exist"
```bash
# Create the role
sudo -u postgres createuser -d pawsco_user
sudo -u postgres psql -c "ALTER USER pawsco_user WITH PASSWORD 'password_123';"
```

### "Database 'pawsco_dev' does not exist"
```bash
# Create the database
sudo -u postgres createdb -O pawsco_user pawsco_dev

# Initialize it
npm run db:migrate
```

### Port 3001 already in use
The server will automatically find an available port. Check the console output for the actual port number.

---

## Milestone 2 — HTML, CSS, Front‑End JS

**Goal:**
Convert your **site design mock-ups** from Milestone 1 into real **HTML and CSS** code, plus **minimal Front‑End JavaScript**.

You will add more functionality (Back‑End JavaScript, database, APIs) in later milestones.

**Requirements:**

* Implement your site’s structure and styling using **HTML5 and CSS3**.
* Include **all pages** from your design:

  * Home page
  * Product or content pages
  * Navigation and intermediate pages
* Use placeholder images where needed (final images will come later).
* Ensure that all navigation links work correctly.
* The site should load and display correctly when served from your Express server.
* **Front‑End JS scope for M2:** Keep it minimal and client‑side only (e.g., DOM manipulation, basic event handling, simple form validation). **No server routes, database calls, or external APIs yet.**

MILESTONE 2 ASSIGNMENTS:

Jake: 
- complete "home" page
- Complete  "Scheduling" page (both Meet and Greet and Book a stay)
	- thinking about possible back-end scheduling comms capability here too

Shanghong:
- Complete "contact us" page
- Complete "about" page

Trieu:
- Complete "Sign-In" page
- Complete "Payments" page
	- Up to you an which payments page design you want to chose

Edward:
- Create the Navigation bar on top of the webpage
	- this navigation bar will be consistent at the top of each page! ie we will all need to implement this code in each of our pages
- Create "Log-in" and "Profile" buttons
- Complete "FAQs" page

Design notes Milestone 2:
- I think we are all in agreeance about which website we are using as our guide for this project
- I think we should use the font from the website for the title and buttons in the nav bar at the top, but we should use a different font 
  for now, lets just use "calibri" as a default, this is a simple change later, but for now we should all use the same font so that we can
  see how the site looks from a big picture perspective.

Check-in timeline Milestone 2:
- DUE: Wednesday,  Nov 5
	- we will have to present this day!
- Check in 1:
	- Mon Oct 25
	- I want us to check in next monday to see where everyone is at	
	- Everyone should have a significant start to their section
	- If you feel you have to much work to complete, say something this day(or sooner!)
- Check in 2: 
	- Mon Nov 3
	- Sections should be close to being done if not complete
	- if we are not done with a specific feature, we can brainstorm if we can complete that work amongst the group
	- Check in about presenting (remember it is super short, low stakes imo)
---

## Project Organization

* **Directory structure:**
  Group related files into subdirectories for clarity. Example:

  ```
  public/
    index.html
    script.js <--- Front End JS goes here (under public/)
    products/
      item1.html
      item2.html
    css/
      style.css
    images/
      logo.png
      products/
  README.md
  server.js <--- Back End JS goes here (outside of public/)
  ```

* **Meaningful names:**
  Use clear, descriptive file names. URLs should make sense to the user.

* **Version control:**
  Commit regularly with meaningful messages. Demonstrate steady, collaborative progress.

---

## Submission

Each team submits **once** (only one submission per team):

1. **GitHub Repository:**
   Your project code should be in this repository.

   * Git tag your code with:

   ```
   git tag -a HTMLCSS -m "TAG HTMLCSS Version"
   git push origin --tags
   ```

2. **PDF Write-Up (on Canvas):**
   Upload one PDF including:

   * Team name
   * All team members and GitHub usernames
   * Repository link
   * Description of what you implemented
   * Problems encountered and how you solved them
   * Any known issues or incomplete features
   * Use of GenAI

> (Use the write-up template.)

---

## Presentation

You will present your working website on **presentation day**.
Be ready to demonstrate:

* Full site navigation
* Page layouts and design consistency
* CSS styling choices
* Team collaboration process

---

## Rubric (100 Points)

| Category                            | Points | Description                                                                  |
| ----------------------------------- | ------ | ---------------------------------------------------------------------------- |
| **Look & Feel**                     | 15     | Visual quality, fidelity to mock-ups, use of color, spacing, and typography. |
| **Completeness**                    | 15     | All planned pages and navigation paths implemented.                          |
| **Organization & Code Quality**     | 10     | Logical directory structure, readable HTML/CSS, clear naming.                |
| **Usability & Accessibility**       | 10     | Intuitive navigation, responsive design, proper alt text, readable contrast. |
| **Consistency**                     | 10     | Cohesive layout, fonts, and style across pages.                              |
| **Functionality**                   | 10     | All navigation links work, site runs correctly via Node/Express.             |
| **Problem Solving & Documentation** | 10     | Clear write-up describing issues, debugging steps, and solutions.            |
| **Presentation**                    | 10     | Engaging demo, teamwork evident, professional delivery.                      |
| **Would You Use This Site?**        | 10     | Overall polish, appeal, and usability from a user’s perspective.             |

**Total: 100 points**
*All team members receive the same grade. Teams are responsible for dividing the work equitably.*

---

## Coming Up Next

**Milestone 3 — Back‑End & Data (Preview):**

* Introduce **Back‑End JavaScript** with Express routes and controllers.
* Implement form handling and validation (server‑side), and dynamic updates via fetch/XHR from the client.
* Integrate **PostgreSQL** for persistence (CRUD) using a Node/Postgres client.
* Build basic REST API endpoints in Express (no advanced auth yet).

**Milestone 4 — Final Project:**

* Full functionality: robust database integration, API endpoints, **authentication and authorization**, and complete Front‑End behavior.
* Polished styling, mobile responsiveness, and accessibility.
* Final presentation and written reflection.
