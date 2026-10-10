# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
- Passengers and customers who need public transport information and may create an account to manage their profile and requests.
- Company administrators and managers who need authenticated access to operational company information and management tools.

## Product Purpose
Empresa Plana provides passenger transport services and the digital tools customers and company staff need to use and manage those services.

## Operating Context
Customers browse routes and services on the public website. Signed-in customers manage their own profile. Company administrators and managers use a separate, private dashboard.

## Capabilities and Constraints
- The public website supports Catalan, Spanish, English, and French.
- The application uses Astro, PostgreSQL through Prisma, scrypt password hashing, and signed HttpOnly session cookies.
- Public self-registration creates client accounts. **Inferred default:** only an administrator may promote an account to manager; public registration cannot grant privileged roles.
- Only administrators and company managers may access the company dashboard. Other signed-in roles may access their own profile but not company dashboard pages.
- Existing customer, worker, and administrator records must remain usable. Authentication roles are stored as strings in the existing database.

## Brand Commitments
- Preserve the Empresa Plana name and existing Mediterranean Horizon design system and brand identity.
- The user referenced https://empresaplana.cat as the public-site design reference.

## Evidence on Hand
- Existing public transport content, route data, service information, and four locale dictionaries are in `src/`.
- Existing account, session, role, dashboard, and profile API foundations are in `src/lib/`, `src/pages/api/`, and `src/pages/dashboard/`.
- No product performance claims, customer testimonials, or independently verified usage statistics are established here.

## Product Principles
- Public access and account registration must never imply company privileges.
- Each account may access only its own profile and data unless its company role explicitly grants broader access.
- Company dashboard authorization must be enforced on the server, not only by hiding navigation.
- Preserve customer access to public routes and services independently of account status.
