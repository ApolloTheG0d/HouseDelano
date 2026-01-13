# CSC 317 - Group Project Writeup

**Name:** Group Fantastic 4

**Github Repository:** https://github.com/CSC317-F25/group-project-ApolloTheG0d/tree/huy

**Student ID:** (Add your student ID)

**CSC 317 Section:** #04

**Project:** Build HTML/CSS From Group Design + Full-Stack Pet Booking Application

---

## Description

This project is a full-stack pet grooming and dog walking appointment booking system built with Node.js, Express, PostgreSQL, and EJS templating. The application allows pet owners to browse services, book appointments, manage their account and pets, and complete payments. Admins can manage bookings, services, and user accounts. The work completed in this milestone focused on finalizing the frontend HTML/CSS presentation, improving user experience through visual refinements, and adding missing UI components for the comprehensive feature set already implemented.

---

## Approach / What I Did

### 1. **Frontend Styling & Visual Enhancements**
- Enhanced the homepage with professional styling for the "Popular Services" section with gradient backgrounds and hover effects
- Added fancy hyperlinks with smooth transition effects across the application
- Implemented font size scaling (67% reduction initially, then optimized) to create a more balanced visual hierarchy across all pages
- Refined typography and spacing throughout the site for better readability

### 2. **UI Component Development & Asset Management**
- Restored the deleted services page to its full functionality
- Created and integrated high-quality images for various pages:
  - Added background imagery for the homepage and about section
  - Integrated professional photos for dog-related content
  - Added schedule/hero images for the "Meet & Greet" page
  - Included team member photos in the about section
- Updated the account page HTML with enhanced styling and layout (152 line additions)
- Expanded the appointment booking page with improved UI structure and functionality (318 line additions)

### 3. **Database Schema & Seed Data Improvements**
- Added new service add-ons table to support additional service customization
- Enhanced seed data to include initial services and add-ons
- Fixed database issues related to table ownership and PostgreSQL configuration

### 4. **Documentation & Setup Process**
- Created comprehensive setup documentation:
  - SETUP_GUIDE.md - Complete setup instructions with troubleshooting
  - DATABASE_SETUP_CHANGES.md - Detailed explanation of database migration from Docker to local PostgreSQL
  - PORT_SETUP_GUIDE.md - Instructions for setting up public IP access (ports 3000/3001)
  - Updated QUICKSTART.md with simplified, automated setup process
- Automated database initialization with setup-db.js script
- Added npm scripts for database management and quick setup

### 5. **Bug Fixes & Code Quality**
- Fixed pet editing modal to work with updated database schema
- Resolved booking creation issues by ensuring password hashing for new users
- Fixed authentication issues in the appointment booking flow
- Implemented proper redirect for unauthenticated users attempting to book appointments
- Enhanced error handling across the application

---

## Issues and Resolutions

### Issue 1: Database Schema Mismatch
**Problem:** Pet editing was trying to update a non-existent `updated_at` column, and the API didn't properly handle different field name formats (name vs. petName).

**Resolution:** 
- Removed the non-existent column reference from the pet editing logic
- Implemented flexible field name handling to accept both 'name' and 'petName' formats
- Improved error handling and validation in the pet management routes

**Commit:** 65cfc62

---

### Issue 2: Appointment Booking Authentication
**Problem:** Unauthenticated users could attempt to access the booking page, and the booking form didn't properly validate payment requirements.

**Resolution:**
- Implemented authentication middleware for appointment booking routes
- Added automatic redirects to login page for unauthenticated users
- Required authentication before allowing any booking operations
- Fixed booking creation to automatically hash passwords for new user accounts

**Commit:** 715c6b1, e624f75

---

### Issue 3: Service Add-ons Integration
**Problem:** The appointment booking form displayed service add-ons but there was no database support for storing and retrieving them.

**Resolution:**
- Created `service_addons` table in the database schema
- Implemented public APIs to dynamically load services and their associated add-ons
- Updated the booking display to show selected add-ons in user's booking history
- Modified the appointment booking form to properly send add-on selections

**Commit:** d11a7b5, 7ad46a2

---

### Issue 4: Payment System Integration
**Problem:** Payment functionality needed to be integrated with the booking system, and the payment page styling was lost during implementation.

**Resolution:**
- Implemented a complete payment system that shows pending bookings
- Auto-imports owner information from the authenticated user account
- Allows users to select which pet is being groomed for each service
- Redirects to payment page after booking approval
- Preserved original payment.html styling while adding API-based processing

**Commit:** 6a65719, 5a2716c, a11b1c1

---

### Issue 5: Setup & Deployment Configuration
**Problem:** Automated setup was failing, and PostgreSQL password wasn't being set correctly, causing database connection errors.

**Resolution:**
- Created automated setup script (setup-db.js) that:
  - Checks for PostgreSQL installation
  - Creates database user with proper permissions
  - Sets password correctly
  - Creates and initializes the database
  - Fixes table ownership issues
- Added PORT_SETUP_GUIDE documentation for public IP access
- Simplified the quick-start process with automated database initialization

**Commit:** dba28de, f06ba1c, 9c3c488

---

## Analysis

### Key Achievements
1. **Complete Frontend Implementation:** All HTML pages are now styled and integrated with the backend, providing a professional user interface
2. **Robust Payment System:** Full payment flow from booking to payment page is working seamlessly
3. **Improved User Experience:** Enhanced visual design with better typography, spacing, and interactive elements
4. **Automated Setup:** New users can now get the application running with a single command
5. **Documentation:** Comprehensive guides for setup, database changes, and port configuration

### Technical Improvements
- Migrated from Docker-based database to local PostgreSQL for easier development
- Implemented proper authentication and authorization checks
- Added comprehensive error handling and validation
- Improved database schema to support all application features
- Created reusable API endpoints for dynamic content loading

### What Worked Well
- The modular architecture allowed for easy integration of frontend and backend
- Commit-by-commit development provided clear tracking of progress
- Clear separation of concerns between routes, database, and views
- Comprehensive testing through manual verification of each feature

### Challenges Overcome
- Font size optimization required testing different scales to maintain readability
- Database schema adjustments needed careful migration planning
- Image optimization was necessary to balance quality with file sizes
- Payment system integration required coordination between multiple components

---

## Relevant Code and Screenshots

### Key Files Modified/Created

1. **public/appointmentForbooking.html** (318 line additions)
   - Fully functional appointment booking form with dynamic service/add-on loading
   - Integrates with backend APIs for real-time data

2. **public/account.html** (152 line additions)
   - Enhanced user account page with pet management
   - Displays user bookings and allows pet profile editing

3. **routes/bookings.js**
   - Complete booking management with appointment creation, approval, and payment tracking
   - API endpoints for dynamic service and add-on loading

4. **SETUP_GUIDE.md** (236 lines)
   - Comprehensive setup instructions
   - Troubleshooting guide for common issues

5. **QUICKSTART.md** (revised)
   - Simplified quick-start process
   - Automated database setup

### Database Schema Additions
```sql
-- Service Add-ons Table
CREATE TABLE service_addons (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id),
  addon_name VARCHAR(100) NOT NULL,
  addon_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Example API Endpoints Created
- `GET /api/services` - List all services with add-ons
- `GET /api/services/:id/addons` - Get add-ons for a specific service
- `POST /api/bookings` - Create new appointment booking
- `PUT /api/bookings/:id` - Update booking status
- `POST /api/payments` - Process payment

---

## Use of GenAI

### How GenAI Was Used
1. **Code Debugging:** Used AI assistance to identify and fix bugs in pet editing logic and payment system integration
2. **Documentation:** Generated clear, structured documentation for setup guides and database changes
3. **Error Handling:** AI provided suggestions for comprehensive error handling and validation patterns
4. **API Design:** Guidance on RESTful API design for service and add-on endpoints
5. **Frontend Styling:** Suggestions for CSS improvements and responsive design patterns

### Limitations & Manual Work
- All HTML/CSS modifications were made manually to ensure alignment with design specifications
- Database schema changes required manual planning and testing
- Frontend integration testing was done manually to verify user workflows
- Image optimization and asset management was done manually
- All commits were authored with clear, descriptive messages

### Value Added
- Accelerated development of comprehensive documentation
- Improved code quality through better error handling patterns
- Provided best practices for API design and database schema
- Helped troubleshoot complex integration issues

---

## Commits Summary

**Total Commits After 3d5a72bc797f19fcb2044b46fd32bcaf8278a41d:** 21 commits

| Commit | Message | Impact |
|--------|---------|--------|
| 437eae7 | Changed the font of homepage | Frontend styling |
| e9e266d | Add schedule-hero.jpg for Meet & Greet page | Asset management |
| 2f813c4 | Enhance homepage styling & hyperlinks | Frontend polish |
| 16be62b | huy added something | Content update |
| 17fdd3a | Reduce font sizes to 67% scale | UI refinement |
| e303dda | WIP: overwrite remote Jake with current work | Branch sync |
| da0ab89 | Added photos to home/background, edited font sizes | Asset & styling |
| 310fb8d | Restore deleted services page | Feature restoration |
| a5ac9ab | Pet edit modal implementation | Feature completion |
| 65cfc62 | Fix pet editing schema mismatch | Bug fix |
| 6a65719 | Implement payment flow | Feature implementation |
| 5a2716c | Payment styling & API processing | Feature refinement |
| 715c6b1 | Require authentication for booking | Security enhancement |
| b70100f | Document payment system | Documentation |
| a11b1c1 | Add payment system | Feature implementation |
| e624f75 | Fix booking user creation | Bug fix |
| 7ad46a2 | Show add-ons in user bookings | Feature enhancement |
| d11a7b5 | Appointment booking with add-ons | Feature implementation |
| dba28de | Auto-fix PostgreSQL setup | DevOps improvement |
| 1c99fae | Update QUICKSTART documentation | Documentation |
| f06ba1c | Automated database setup | DevOps improvement |
| 9c3c488 | Port setup guide & public IP access | Infrastructure |

---

**Date Completed:** December 15, 2025

**Branch:** huy

**Status:** ✅ Milestone Complete
