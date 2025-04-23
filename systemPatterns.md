# System Patterns

## Design Patterns

### Frontend Patterns

#### Component Structure
- **Atomic Design**: Organize components by atoms, molecules, organisms, templates, and pages
- **Container/Presentation Pattern**: Separate data handling from UI rendering
- **Compound Components**: Use React Context for related component groups

#### State Management
- **Context API**: Use for global state with reducers for complex state logic
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Memoization**: Use React.memo, useMemo, and useCallback for performance optimization

#### Navigation
- **Protected Routes**: Auth-gated routes for secure areas
- **Role-Based Access Control**: Component visibility based on user roles
- **Breadcrumb Navigation**: For complex tournament management flows

### Backend Patterns

#### API Design
- **RESTful Resources**: Organize endpoints around resources (/tournaments, /users, etc.)
- **Controller-Service-Repository**: Separation of concerns:
  - Controllers handle HTTP requests/responses
  - Services contain business logic
  - Repositories handle data access

#### Authentication
- **JWT Authentication**: Stateless authentication with refresh token pattern
- **Role-Based Authorization**: Middleware to verify permissions for actions

#### Error Handling
- **Global Error Handler**: Centralized error processing
- **Error Classifications**: Distinguish between operational, validation, and system errors
- **Detailed Logging**: Structured logging with appropriate error context

### Database Patterns

#### Schema Design
- **Embedding vs. Referencing**: Use embedding for tightly coupled data, references for shared entities
- **Normalized Collections**: For frequently changing data (users, teams)
- **Denormalized Data**: For read-heavy operations (tournament results, standings)

#### Query Patterns
- **Aggregation Pipeline**: For complex data transformations and calculations
- **Indexing Strategy**: Create indexes based on common query patterns
- **Pagination**: Use for large collections with skip/limit pattern

## Code Conventions

### Frontend
- **File Organization**: Feature-based folder structure
- **Component Naming**: PascalCase for components, camelCase for hooks
- **CSS Approach**: Material-UI styled components with theme extension

### Backend
- **File Organization**: MVC pattern with service layer
- **Naming Conventions**: camelCase for variables/functions, PascalCase for classes
- **API Response Format**: Consistent structure with status, data, and message fields

### General
- **ESLint Configuration**: AirBnB style guide with custom rules
- **Git Workflow**: Feature branch workflow with conventional commits
- **Documentation**: JSDoc comments for functions, Swagger/OpenAPI for API endpoints

## Architectural Decisions

### Single Page Application
- React-based SPA for fluid user experience and reduced server load
- Client-side routing for performance

### Stateless Backend
- JWT authentication enables horizontal scaling
- No session state stored on server

### Real-time Updates
- Socket.io for tournament status and round updates
- Event-based architecture for real-time changes

### Mobile Responsiveness
- Mobile-first approach with responsive breakpoints
- Simplified interface for mobile users (judges, participants)

### Error Recovery
- Optimistic UI updates with rollback on failure
- Retry mechanisms for network failures 