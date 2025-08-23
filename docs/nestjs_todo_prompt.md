# NestJS Role-Based ToDo App Prompt

I want you to act as a senior NestJS backend engineer.  
Build a **role-based ToDo application backend** using **NestJS (latest version)**, following industry best practices.

---

## Tech Stack

- **Database**: SQLite
- **ORM**: TypeORM
- **Auth**: JWT authentication with role-based authorization (admin, user).
- **Config Management**: Use `@nestjs/config` to manage environment variables from a `.env` file.
- **Pagination/Filtering**: Use `nestjs-paginate` package for pagination, sorting, filtering, and searching.
- **Security**: Enable CORS, rate limiting, and other standard NestJS/Express security middlewares.

---

## Roles

- **User**: Can only create, read, update, and delete their own tasks.
- **Admin**: Can create, read, update, and delete any user’s tasks.
- **Admin**: Can also **CRUD users** (manage accounts, including deleting users and their profiles/tasks).

---

## Entities

- **User**: id (UUID), username, password (hashed), role (enum: admin | user), timestamps
- **UserProfile**: id (UUID), userId (relation with User), fullName, bio, image (string or blob), timestamps
- **Task**: id (UUID), title, description, owner (User relation), timestamps

---

## Requirements

1. Implement clean project structure using NestJS best practices (modules, services, controllers, DTOs, guards, interceptors).
2. Use **TypeORM decorators** for entities and relations.
3. Use **UUID** as the primary key for all entities (`User`, `UserProfile`, `Task`).
4. Use **DTOs + Validation Pipes** for input validation.
5. Implement **AuthModule** with JWT, Passport strategies (local + jwt).
6. Implement **RolesGuard** for role-based access control.
7. Protect all task and user routes with authentication + role-based permissions.
8. Seed an **admin user** by default.
9. Add a **Global Exception Filter** (e.g. `HttpExceptionFilter`) to standardize error responses.
10. Create a **common folder/module** to hold reusable utilities like:

- custom decorators (`@GetUser`, `@Roles`)
- response interceptors (success wrapper)
- shared DTOs, constants, enums
- exception filters

11. Provide example **API endpoints** with request/response payloads.
12. Follow **SOLID principles** and **NestJS best practices**.
13. Add error handling and return proper HTTP status codes.
14. **User Profile Requirements**:
    - Each `User` will automatically have a `UserProfile` created when the user is registered.
    - The `UserProfile` will be automatically deleted if the user is deleted.
    - When a user is deleted, all their related `Tasks` should also be deleted.
    - The `UserProfile` includes an `image` field (stored as string path or blob).
15. **Config Management**:
    - Store sensitive information (JWT secret, DB config, etc.) in a `.env` file.
    - Load configs using `@nestjs/config`.
16. **Pagination/Filtering/Search**:
    - Integrate `nestjs-paginate` in list endpoints (Users, Tasks).
    - Support pagination, sorting, filtering, and searching on fields like:
      - Users → username, role
      - Tasks → title, description, owner
    - Return paginated responses with metadata (total, page, limit).
17. **Security Concerns**:
    - Enable **CORS** in `main.ts`.
    - Add **rate limiting** (e.g., `@nestjs/throttler`).
    - Use **Helmet** middleware for secure HTTP headers.
    - Hash passwords with **bcrypt**.
    - Store JWT secret and other sensitive configs in `.env`.
    - Implement refresh tokens for long-lived sessions (optional).
18. **Logging**
    - Integrate **nest-winston** for robust, structured logging.
    - Use a global **LoggingInterceptor** to log every request with details like method, URL, status code, and response time etc.
    - Configure Winston to use both console and file transports.

---

## Project Structure

Generate the **full project structure with code files** (not just snippets), including:

- `main.ts`
- `app.module.ts`
- `auth` module (JWT, Passport, Guards, Roles)
- `users` module (entity, service, controller, repo)
- `user-profile` module (entity, service, controller, repo)
- `tasks` module (entity, service, controller, repo)
- `common` folder (decorators, guards, filters, interceptors, constants)
- `typeorm.config.ts` (for SQLite, using env configs)
- `.env.example` (sample env file with JWT_SECRET, DB configs, etc.)

---

## Additional Notes

- Explain how to run migrations, seed data, and test the endpoints with curl or Postman.
- Show how `.env` variables are loaded and accessed using `@nestjs/config`.
- Show example usage of `nestjs-paginate` for listing users and tasks with query parameters (pagination, sorting, filtering, searching).
- Document how CORS, rate limiting, and Helmet are configured in the project.
