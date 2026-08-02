# 3PL Work Security, Authentication, Authorization & Data Protection Standards

## Purpose

This document defines the security standards for the complete 3PL Work platform, including:

- Web application
- Mobile application
- Backend services
- APIs
- Database
- File storage
- Authentication services
- Background jobs
- Third-party integrations
- Infrastructure
- Administrative tools
- Reporting and exports
- Internal support tools

The primary objectives are to:

- Prevent unauthorized access
- Prevent users from accessing irrelevant customer, warehouse, employee, payroll, billing, or operational data
- Protect authentication credentials and tokens
- Enforce tenant, role, warehouse, customer, and resource isolation
- Secure communication between clients, servers, and external services
- Reduce the impact of compromised accounts, tokens, devices, or integrations
- Detect suspicious behavior
- Maintain reliable audit trails
- Protect sensitive employee, customer, financial, and operational information
- Prevent accidental data leakage
- Ensure security controls remain consistent as the platform grows

Security must be enforced by the backend.

Frontend restrictions improve usability, but they are not security controls.

A hidden button, disabled control, unavailable page, missing navigation item, or client-side route guard does not prevent an attacker from calling an API directly.

---

# 1. Core Security Principles

## 1.1 Deny by Default

Every resource, API endpoint, function, field, action, file, report, export, and administrative capability should be inaccessible unless access is explicitly granted.

The system should never assume that a logged-in user is automatically authorized to access a resource.

Authorization rules must explicitly allow access.

Anything not explicitly allowed must be denied.

---

## 1.2 Least Privilege

Users, applications, tokens, services, integrations, background jobs, and database accounts should receive only the permissions required for their responsibilities.

Examples:

- Employees should not access customer billing.
- Customers should not access employee pay rates.
- Warehouse leads should not access unrelated warehouses.
- Payroll users should not automatically receive system administration permissions.
- Billing users should not automatically access payroll details.
- Integration tokens should only access the endpoints required by that integration.
- Read-only users should never receive write permissions.
- Background jobs should use restricted service identities.
- Support users should not automatically access tenant data.

Permissions should be as narrow as practical.

---

## 1.3 Never Trust the Client

Treat all information received from the web application, mobile application, browser, integration, webhook, or external service as untrusted.

Never trust client-provided values such as:

- User ID
- Tenant ID
- Organization ID
- Customer ID
- Warehouse ID
- Employee ID
- Role
- Permission
- Pay rate
- Billing rate
- Approval status
- Ownership
- Created-by field
- Updated-by field
- Administrative flags
- Calculated totals
- Record status
- Audit metadata
- Token claims that have not been validated
- File name
- File type
- Redirect URL
- Callback URL

The backend must derive security-sensitive context from authenticated sessions, validated tokens, trusted configuration, and server-side data.

---

## 1.4 Defense in Depth

Do not rely on one security control.

Important operations should be protected through multiple layers:

- Authentication
- Session validation
- Role authorization
- Permission authorization
- Tenant isolation
- Warehouse scope
- Customer scope
- Object-level authorization
- Field-level authorization
- Input validation
- Business-rule validation
- Database constraints
- Audit logging
- Monitoring
- Rate limiting
- Network restrictions
- Secret management

A failure in one layer should not expose the complete system.

---

## 1.5 Minimize Data Exposure

Return only the information required for the current operation.

Do not automatically return complete database entities.

Do not expose internal or sensitive fields because they happen to exist on a model.

Every API response should use an explicit response schema or data transfer object.

Every create and update operation should use explicit input allowlists.

---

## 1.6 Secure by Design

Security should be considered while designing features, not after implementation.

Every feature should define:

- Who can access it
- Which tenant owns the data
- Which records are visible
- Which fields are visible
- Which actions are allowed
- Which actions require elevated permissions
- Which actions require reauthentication
- Which actions must be audited
- How failures are handled
- How abuse is prevented

---

## 1.7 Fail Securely

When a security check fails:

- Deny access
- Avoid partial execution
- Avoid leaking sensitive details
- Record the event where appropriate
- Return a consistent error response
- Preserve transactional integrity

Unexpected errors must not result in broader access.

---

# 2. Security Ownership

Security responsibilities must be clearly separated.

## 2.1 Frontend Responsibilities

The frontend should:

- Hide unavailable actions for usability
- Display permission errors clearly
- Protect tokens according to the selected architecture
- Avoid logging sensitive data
- Validate user input for usability
- Prevent accidental duplicate actions
- Use secure browser APIs
- Handle session expiration
- Avoid exposing secrets in bundles
- Use route guards for experience only
- Avoid rendering sensitive information unnecessarily
- Clear sensitive state after logout
- Avoid caching sensitive data carelessly
- Respect security-related response states from the backend

The frontend must not be treated as the final authorization layer.

---

## 2.2 Backend Responsibilities

The backend must:

- Authenticate every protected request
- Resolve the authenticated user
- Resolve the active tenant
- Validate the session or access token
- Enforce permissions
- Enforce tenant boundaries
- Enforce warehouse and customer scope
- Enforce object ownership
- Validate all identifiers
- Validate all payloads
- Restrict returned fields
- Restrict writable fields
- Protect sensitive actions
- Generate audit records
- Reject requests that fail any security check
- Prevent duplicate sensitive operations
- Apply rate limits where required
- Avoid exposing internal errors
- Revalidate permissions for background jobs
- Revalidate permissions for WebSocket subscriptions
- Revalidate permissions for exports and reports

---

## 2.3 Database Responsibilities

The database should:

- Enforce tenant ownership where practical
- Enforce foreign keys
- Enforce uniqueness constraints
- Enforce non-null constraints
- Prevent invalid relationships
- Restrict database users
- Encrypt storage
- Support backups and restoration
- Support row-level security where appropriate
- Prevent unauthorized cross-tenant relationships
- Support transactional operations
- Prevent duplicate financial or workflow records
- Separate application runtime permissions from migration permissions

---

## 2.4 Infrastructure Responsibilities

Infrastructure should:

- Enforce HTTPS
- Protect secrets
- Restrict network access
- Separate environments
- Restrict production access
- Maintain audit logs
- Support patching
- Support monitoring
- Support backup and recovery
- Prevent public access to private databases and file storage
- Apply secure configuration defaults
- Rotate credentials
- Limit service permissions

---

# 3. Identity Model

Every authenticated identity should use a stable internal identifier.

Recommended identity attributes include:

- `userId`
- `tenantId`
- `organizationId`
- `accountStatus`
- `roleIds`
- `permissionSet`
- `sessionId`
- `authenticationMethod`
- `authenticationTime`
- `tokenVersion`
- `warehouseScope`
- `customerScope`
- `deviceId`
- `membershipId`

Do not use email addresses as permanent database identifiers.

Email addresses may change.

Do not trust role or permission values supplied by the client.

Roles and permissions must be resolved from trusted server-side data.

---

# 4. Multi-Tenant Data Isolation

3PL Work may serve multiple staffing companies, customers, warehouse locations, and operational groups.

Tenant isolation is one of the platform's most important security requirements.

A cross-tenant data leak should be treated as a critical security incident.

---

## 4.1 Tenant-Owned Records

Every tenant-owned record should contain a trusted ownership reference, such as:

- `tenantId`
- `organizationId`
- `companyId`

Tenant-owned records may include:

- Customers
- Warehouses
- Employees
- Users
- Loads
- Time entries
- Payroll records
- Billing records
- Products
- Rates
- Reports
- Files
- Notifications
- Audit logs
- User invitations
- Schedules
- Assignments
- Exports
- Imports
- Integration configurations
- Webhook configurations

---

## 4.2 Tenant Context

The active tenant must be derived from:

- Authenticated session
- Validated token
- Trusted membership record
- Trusted server-side context

Never trust a tenant identifier solely because it was supplied through:

- Request body
- Query parameter
- URL parameter
- Browser storage
- Custom client header
- Mobile local storage

A tenant identifier may appear in a route for clarity, but the backend must verify that the authenticated user belongs to that tenant.

---

## 4.3 Mandatory Tenant Filtering

Every query involving tenant-owned data must include the active tenant scope.

Unsafe:

```ts
const load = await loadRepository.findById(loadId);
```

Safer:

```ts
const load = await loadRepository.findOne({
  id: loadId,
  tenantId: authenticatedTenantId,
});
```

Preferred architecture:

```ts
const load = await tenantScopedLoadRepository.findById(loadId);
```

The preferred architecture makes unscoped queries difficult to write accidentally.

---

## 4.4 Do Not Query Then Check Later

Avoid:

```ts
const load = await loadRepository.findById(loadId);

if (load.tenantId !== user.tenantId) {
  throw new ForbiddenError();
}
```

The record was retrieved before tenant authorization was established.

Prefer:

```ts
const load = await loadRepository.findOne({
  id: loadId,
  tenantId: user.tenantId,
});
```

The database query itself should include the tenant boundary.

---

## 4.5 Cross-Tenant Relationships

When creating or updating relationships, verify that all related records belong to the same authorized tenant.

Before assigning an employee to a load, verify:

- Employee belongs to the active tenant
- Load belongs to the active tenant
- Warehouse belongs to the active tenant
- Customer belongs to the active tenant
- Employee is eligible for the relevant warehouse or customer
- Current user has permission to create the assignment
- Current workflow state allows the assignment

Matching IDs do not prove valid ownership.

---

## 4.6 Shared Platform Data

Some records may be platform-wide rather than tenant-owned.

Examples:

- Supported countries
- System feature definitions
- Global reference data
- Platform configuration
- Shared product metadata

Shared records must be clearly separated from tenant-owned records.

Do not mix global and tenant-owned data without explicit rules.

---

## 4.7 Tenant Deletion and Suspension

When a tenant is suspended:

- Block new sessions
- Revoke existing sessions where appropriate
- Disable integrations
- Stop background jobs
- Prevent data mutations
- Preserve required audit records

When tenant deletion is requested:

- Follow retention requirements
- Avoid immediate irreversible deletion without approval
- Remove or anonymize data according to policy
- Verify backup lifecycle
- Revoke all credentials and integrations

---

## 4.8 Background Jobs

Every queued job involving tenant data must include verified tenant context.

Workers must revalidate:

- Tenant
- User or service identity
- Resource ownership
- Requested operation
- Current record status
- Permission where applicable

A job must not be considered authorized merely because it exists in a queue.

---

## 4.9 Caches

Cache keys involving tenant-owned data must include tenant scope.

Unsafe:

```text
load:123
```

Safer:

```text
tenant:456:load:123
```

Cached query results must never be shared across tenants unless explicitly designed as global public data.

---

# 5. Authorization Model

Authentication answers:

> Who is the user?

Authorization answers:

> What is the user allowed to do?

These concerns must remain separate.

---

## 5.1 Role-Based Access Control

Potential roles may include:

- Platform Administrator
- Tenant Administrator
- Operations Manager
- Warehouse Lead
- Payroll Manager
- Billing Manager
- Customer Administrator
- Customer User
- Employee
- Read-Only Auditor
- Support Agent

Roles should map to explicit permissions.

Example permissions:

- `customers.read`
- `customers.create`
- `customers.update`
- `customers.delete`
- `warehouses.read`
- `warehouses.manage`
- `employees.read`
- `employees.create`
- `employees.update`
- `employees.delete`
- `employees.assign`
- `loads.read`
- `loads.create`
- `loads.update`
- `loads.close`
- `loads.reopen`
- `timeEntries.read`
- `timeEntries.create`
- `timeEntries.adjust`
- `payroll.read`
- `payroll.calculate`
- `payroll.approve`
- `payroll.export`
- `billing.read`
- `billing.generate`
- `billing.approve`
- `reports.read`
- `reports.export`
- `settings.manage`
- `users.invite`
- `users.disable`
- `roles.manage`
- `audit.read`

Avoid scattered checks such as:

```ts
if (user.role === "admin") {
  // allow
}
```

Prefer centralized checks:

```ts
authorization.requirePermission(user, "payroll.approve");
```

---

## 5.2 Scope-Based Authorization

Role permissions may not be sufficient.

A warehouse lead may have `loads.update`, but only for assigned warehouses.

Authorization should consider:

- Tenant
- Role
- Permission
- Warehouse scope
- Customer scope
- Employee scope
- Resource ownership
- Load status
- Record sensitivity
- Workflow state
- Assignment
- Approval level

---

## 5.3 Object-Level Authorization

Every endpoint receiving an object identifier must verify that the authenticated user can access that specific object.

An attacker may replace:

```text
/api/loads/123
```

with:

```text
/api/loads/124
```

Using UUIDs makes guessing more difficult, but it does not replace authorization.

Object-level checks may include:

- Same tenant
- Same warehouse
- Same customer
- Same employee
- Assigned supervisor
- Explicit permission
- Record ownership
- Workflow state
- Data sensitivity
- Active membership

---

## 5.4 Function-Level Authorization

Every protected operation must verify that the user can perform that function.

Examples:

- Viewing a load does not imply permission to close it.
- Viewing payroll does not imply permission to approve it.
- Viewing users does not imply permission to change roles.
- Creating employees does not imply permission to delete employees.
- Viewing a report does not imply permission to export it.
- Accessing standard routes does not imply access to administrative routes.

Administrative endpoints must never rely on hidden frontend navigation.

---

## 5.5 Field-Level Authorization

A user may be allowed to access a record without being allowed to see every field.

Customer users may see:

- Employee display name
- Shift status
- Assigned load
- Work progress

They should not automatically see:

- Pay rate
- Home address
- Personal phone number
- Tax information
- Banking information
- Internal notes
- Disciplinary records

Use explicit response models.

Do not serialize database records directly.

---

## 5.6 Write Allowlisting

For create and update operations, allow only explicitly approved fields.

Unsafe:

```ts
employee.update(request.body);
```

Safer:

```ts
employee.update({
  firstName: request.body.firstName,
  lastName: request.body.lastName,
  phone: request.body.phone,
});
```

Never allow clients to update protected properties such as:

- `tenantId`
- `organizationId`
- `role`
- `permissions`
- `isAdmin`
- `createdBy`
- `updatedBy`
- `approvedBy`
- `approvalStatus`
- `payrollTotal`
- `billingTotal`
- `tokenVersion`
- `passwordHash`
- `accountStatus`
- `auditMetadata`

---

## 5.7 Segregation of Duties

Sensitive workflows should avoid giving one user complete control.

Examples:

- A payroll preparer may not approve their own payroll batch.
- A billing creator may not approve their own invoice where separation is required.
- A role administrator should not approve their own elevated access.
- A user changing bank information may require secondary approval.

This should be configurable based on business requirements.

---

# 6. Authentication Standards

## 6.1 Password Storage

Never store passwords in plaintext.

Never store passwords using reversible encryption.

Use a password hashing algorithm designed for password storage, such as:

- Argon2id
- scrypt
- bcrypt with a suitable work factor

Use:

- Unique salt for every password
- Configurable work factors
- Secure migration strategy
- Server-side pepper where architecture supports it
- Constant-time comparison

---

## 6.2 Password Requirements

Recommended password policy:

- Allow long passphrases
- Support password managers
- Allow paste
- Do not silently truncate
- Block common or compromised passwords
- Avoid unnecessary composition rules
- Avoid mandatory periodic changes unless required
- Require a change after suspected compromise
- Set a reasonable minimum length
- Permit a high maximum length

Do not force confusing rules that lead users to create predictable passwords.

---

## 6.3 Login Errors

Avoid revealing whether an account exists.

Prefer:

```text
Invalid email or password.
```

Avoid:

```text
No account exists for this email.
```

The same principle should apply to password reset and invitation flows.

---

## 6.4 Login Rate Limiting

Protect login against:

- Brute-force attacks
- Credential stuffing
- Password spraying
- Automated account discovery
- Bot attacks

Use a combination of:

- Per-account limits
- Per-IP limits
- Per-device limits
- Progressive delays
- Temporary lockouts
- Bot detection where justified
- Security alerts
- Monitoring

Avoid permanent lockouts that attackers can exploit to deny service.

---

## 6.5 Multi-Factor Authentication

Support MFA for sensitive accounts.

MFA should be strongly encouraged or required for:

- Platform administrators
- Tenant administrators
- Payroll approvers
- Billing approvers
- Security administrators
- Support users
- Users accessing highly sensitive information

Preferred methods:

- Passkeys
- Security keys
- Authenticator applications

SMS may be supported as a recovery or transitional method, but stronger methods should be preferred.

---

## 6.6 Password Reset

Password reset must:

- Use a single-use token
- Use a short expiration window
- Store reset tokens securely
- Invalidate tokens after use
- Avoid revealing account existence
- Log requests and completion
- Revoke relevant sessions after successful reset
- Notify the account owner
- Require reauthentication for sensitive follow-up actions

Do not email passwords.

---

## 6.7 Account Status

Authentication must reject accounts that are:

- Disabled
- Suspended
- Deleted
- Pending activation
- Locked for security review
- Removed from the tenant
- Outside an allowed employment period
- Expired, where applicable

Account status should be checked during login and sensitive actions.

---

## 6.8 Invitations

User invitations must:

- Use single-use tokens
- Expire
- Be tied to a specific email and tenant
- Prevent role manipulation
- Validate invited permissions
- Be revocable
- Be auditable
- Avoid exposing tenant information unnecessarily

---

# 7. Session Management

## 7.1 Session Identity

Every active login should map to a server-recognized session.

Recommended session fields:

- Session ID
- User ID
- Tenant ID
- Membership ID
- Issued time
- Last activity
- Authentication method
- Device information
- IP metadata
- Idle expiration
- Absolute expiration
- Revocation status
- Token family identifier
- MFA status
- Authentication assurance level

---

## 7.2 Session Expiration

Use both:

- Idle timeout
- Absolute session lifetime

Sensitive administrative and financial sessions should use shorter durations.

Do not allow sessions to remain valid indefinitely.

---

## 7.3 Reauthentication

Require recent authentication for sensitive actions.

Examples:

- Changing password
- Changing email
- Enabling or disabling MFA
- Changing bank information
- Changing roles
- Approving payroll
- Approving billing
- Exporting highly sensitive reports
- Deleting critical records
- Viewing highly sensitive personal data
- Creating API keys
- Changing security settings

---

## 7.4 Session Revocation

Support revocation after:

- Logout
- Password change
- Password reset
- Account suspension
- Role change
- Tenant removal
- Suspected compromise
- Administrator action
- Device removal
- MFA reset
- Token reuse detection

Logout must invalidate the server-side session or refresh capability, not only delete frontend state.

---

## 7.5 Active Session Management

Future account settings should allow authorized users to:

- View active sessions
- See approximate device information
- See approximate location
- Revoke individual sessions
- Revoke all other sessions
- Identify current session

---

## 7.6 Concurrent Session Policy

Define whether accounts may have:

- Unlimited sessions
- Limited concurrent sessions
- One session per device
- One mobile and one web session
- Role-specific session limits

Administrators and shared warehouse devices may require special policies.

---

# 8. Token Standards

The token architecture should be selected based on the platform design.

JWTs are not automatically more secure than opaque sessions.

---

## 8.1 Access Tokens

Access tokens should:

- Be short-lived
- Be signed using an approved algorithm
- Include issuer
- Include audience
- Include expiration
- Include issued-at time
- Include a unique identifier where useful
- Include minimal claims
- Avoid sensitive personal data
- Be rejected when malformed, expired, or invalid

Validate:

- Signature
- Algorithm
- Issuer
- Audience
- Expiration
- Not-before time
- Token type
- Session state where applicable
- User status where required
- Tenant membership where required

Never trust the algorithm solely because it appears in the incoming token.

---

## 8.2 Refresh Tokens

Refresh tokens should:

- Be long, random, and unguessable
- Be stored securely
- Be revocable
- Be tied to a session
- Expire
- Use rotation
- Detect reuse
- Be invalidated on logout or compromise
- Be bound to the expected client where practical

---

## 8.3 Refresh Token Rotation

On successful refresh:

1. Validate the current token.
2. Confirm session status.
3. Invalidate the old refresh token.
4. Issue a new refresh token.
5. Record the relationship in a token family.
6. Detect reuse of older tokens.
7. Revoke the token family if reuse indicates theft.

---

## 8.4 Browser Token Storage

For browser applications, prefer:

- Secure HTTP-only cookies
- `Secure` attribute
- Appropriate `SameSite` policy
- Limited cookie path
- Limited cookie domain
- CSRF protection
- Short-lived access sessions

Avoid storing long-lived authentication tokens in:

- Local storage
- Session storage
- JavaScript-readable cookies

An XSS vulnerability may expose JavaScript-readable tokens.

---

## 8.5 Mobile Token Storage

Store sensitive tokens using platform-secure storage:

- iOS Keychain
- Android Keystore-backed secure storage

Do not store tokens in:

- Plain preferences
- Unencrypted databases
- Logs
- Analytics
- Crash reports
- Clipboard
- Notifications

---

## 8.6 Token Claims

Avoid putting highly sensitive information into token claims.

Do not include:

- Password data
- Payroll details
- Banking data
- Home addresses
- Tax identifiers
- Government identifiers
- Internal notes
- Secrets
- Full mutable permission matrices

JWT payloads are encoded, not automatically encrypted.

---

## 8.7 Token Versioning

Use a session version or token version where useful.

Incrementing the version may invalidate issued sessions after:

- Password change
- Permission change
- Role change
- Security incident
- Administrator action
- Tenant removal

---

## 8.8 Signing Keys

Signing keys must:

- Be stored in secure secret management
- Never be committed to source control
- Support rotation
- Use key identifiers
- Have restricted access
- Be separated by environment
- Be monitored
- Support emergency revocation

---

# 9. OAuth, OpenID Connect and External Identity Providers

When implementing OAuth or OpenID Connect:

- Use Authorization Code flow
- Use PKCE
- Validate `state`
- Validate `nonce` where applicable
- Use exact redirect URI matching
- Avoid implicit flow
- Validate issuer
- Validate audience
- Use trusted discovery endpoints
- Store provider secrets securely
- Restrict scopes
- Validate email verification claims
- Map external identities to stable internal identities
- Prevent automatic privilege assignment

Do not grant administrator access solely based on email domain without explicit approval rules.

---

# 10. API Security

## 10.1 Independent Authorization

Every request must independently validate:

- Identity
- Session
- Tenant
- Permission
- Resource
- Requested action
- Workflow state
- Field access
- Membership status

Do not assume that access to one endpoint authorizes access to another.

---

## 10.2 Input Validation

Validate all input on the backend.

Validate:

- Type
- Length
- Format
- Range
- Enumeration
- Required fields
- Relationships
- Business rules
- File type
- File size
- Pagination limits
- Sort fields
- Filter operators
- Dates and time zones
- Numeric precision
- Currency
- Status transitions

Reject unknown fields for sensitive operations.

---

## 10.3 Output Validation

Define explicit response schemas.

Do not automatically return:

- ORM entities
- Complete database records
- Internal fields
- Secret fields
- Security metadata
- Soft-delete metadata
- Internal identifiers not needed by the client
- Hidden relationships
- Sensitive audit data

---

## 10.4 Pagination

Every potentially large collection endpoint should enforce:

- Default page size
- Maximum page size
- Stable ordering
- Safe filters
- Safe sort fields
- Cursor pagination where appropriate

Prevent abusive requests such as:

```text
?pageSize=10000000
```

---

## 10.5 Rate Limiting

Apply rate limits to:

- Login
- Password reset
- Verification
- Invitations
- File uploads
- Search
- Export
- Report generation
- Public endpoints
- Resource-intensive calculations
- AI endpoints
- Webhooks
- Bulk operations
- Token refresh

Rate limits should consider:

- User
- Tenant
- IP
- Device
- Endpoint
- Operation cost

---

## 10.6 Idempotency

Use idempotency keys for operations that must not be duplicated.

Examples:

- Payroll generation
- Billing generation
- Payment actions
- Import execution
- Load closure
- Time submission
- External integration submissions
- Invoice creation
- Employee clock-in and clock-out where duplicate requests are possible

---

## 10.7 API Versioning

Security-sensitive API changes should use controlled versioning.

Avoid breaking clients in ways that bypass validation or authorization.

Deprecated endpoints must not remain indefinitely if they use weaker security.

---

## 10.8 Error Responses

Do not expose:

- Stack traces
- SQL queries
- Internal file paths
- Environment variables
- Secret names
- Infrastructure details
- Raw third-party errors
- Internal hostnames

Return:

- Stable error code
- Human-readable message
- Correlation ID
- Field validation details where safe

---

# 11. Network Security

## 11.1 HTTPS

All production communication must use HTTPS.

Do not allow:

- Plain HTTP authentication
- Plain HTTP API access
- Mixed-content resources
- Insecure WebSocket connections
- Insecure callback URLs

---

## 11.2 HSTS

Enable HTTP Strict Transport Security after confirming all required domains support HTTPS.

---

## 11.3 Internal Service Communication

Service-to-service traffic should use:

- Private networks where possible
- TLS
- Service identity
- Short-lived credentials
- Restricted network rules
- Explicit destination allowlists
- Mutual TLS where justified

Do not assume the internal network is trusted.

---

## 11.4 CORS

CORS must use an explicit allowlist.

Avoid:

```text
Access-Control-Allow-Origin: *
```

for authenticated APIs.

Configure:

- Allowed origins
- Allowed methods
- Allowed headers
- Credential behavior
- Preflight caching

Never dynamically reflect arbitrary origins without validation.

---

## 11.5 CSRF

When browser authentication uses cookies, protect state-changing requests against CSRF.

Controls may include:

- SameSite cookies
- CSRF tokens
- Origin validation
- Referer validation as an additional signal
- Custom headers

Do not rely on CORS alone as the only CSRF defense.

---

## 11.6 WebSockets

WebSocket connections must:

- Authenticate during connection establishment
- Revalidate authorization for subscriptions
- Scope channels by tenant
- Prevent cross-tenant channel access
- Handle token expiration
- Apply message size limits
- Apply rate limits
- Validate message schemas
- Remove subscriptions after permission changes where practical

Do not trust channel names supplied by the client.

---

## 11.7 DNS and Redirect Security

Any server-side redirect or URL fetch must validate destinations.

Do not allow arbitrary redirects to attacker-controlled URLs.

Use explicit redirect allowlists.

---

# 12. Browser Security

Apply security headers where appropriate:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `frame-ancestors` through CSP

Use secure cookie attributes.

Avoid unnecessary inline scripts.

Restrict third-party script and asset sources.

Review external analytics and monitoring scripts before inclusion.

---

# 13. Injection Prevention

## 13.1 SQL Injection

Use:

- Parameterized queries
- Prepared statements
- Safe ORM methods
- Allowlisted sort fields
- Allowlisted filters
- Restricted database permissions

Never construct SQL using untrusted string concatenation.

---

## 13.2 Command Injection

Avoid executing operating-system commands from user input.

When unavoidable:

- Use fixed executable paths
- Pass arguments safely
- Avoid shell interpretation
- Allowlist values
- Use low-privilege processes
- Enforce timeouts
- Limit output
- Run in isolated environments

---

## 13.3 Cross-Site Scripting

Prevent XSS through:

- Output escaping
- Safe rendering frameworks
- Avoiding unsafe HTML rendering
- Sanitizing rich text
- Content Security Policy
- Avoiding dangerous DOM APIs
- Reviewing third-party widgets
- Avoiding secrets in browser-accessible storage

---

## 13.4 Template Injection

Never place untrusted input into server-side template expressions or dynamic evaluation.

Avoid:

- `eval`
- Dynamic code generation
- Untrusted expression engines
- Unrestricted template execution

---

## 13.5 NoSQL Injection

When using document databases:

- Validate query shapes
- Reject unknown operators
- Prevent users from supplying raw query objects
- Use typed query builders
- Allowlist operators

---

# 14. File Upload Security

Treat all uploads as hostile.

Validate:

- Allowed file type
- File signature
- MIME type
- Extension
- File size
- File name
- Upload count
- User permission
- Tenant ownership

Additional controls:

- Generate server-side file names
- Store files outside executable application directories
- Prevent path traversal
- Scan files where appropriate
- Strip dangerous metadata where appropriate
- Use signed download URLs
- Prevent public bucket access
- Restrict inline rendering of dangerous formats
- Set content-disposition safely
- Quarantine files until validated
- Delete failed uploads

Never trust the original file name or client-provided MIME type.

---

# 15. Data Classification

Classify data according to sensitivity.

## 15.1 Public

Examples:

- Public documentation
- Public product information

## 15.2 Internal

Examples:

- Internal configuration
- Non-sensitive system metadata
- Internal workflow notes without personal data

## 15.3 Confidential

Examples:

- Employee contact details
- Customer contracts
- Pay rates
- Billing rates
- Internal reports
- Operational history
- Customer pricing

## 15.4 Highly Sensitive

Examples:

- Password hashes
- Authentication secrets
- Banking information
- Tax identifiers
- Government identifiers
- Security recovery information
- Private API keys
- Payroll details
- Personal financial information

Security controls should increase with sensitivity.

---

# 16. Encryption

## 16.1 Data in Transit

Use TLS for:

- Browser communication
- Mobile communication
- Service-to-service communication
- Database connections where supported
- File storage connections
- Webhooks
- External integrations

---

## 16.2 Data at Rest

Use encryption for:

- Production databases
- Backups
- Object storage
- Sensitive mobile local data
- Secret stores
- Log storage where sensitive metadata exists

---

## 16.3 Field-Level Encryption

Consider field-level encryption for:

- Banking details
- Tax identifiers
- Government identifiers
- Integration credentials
- Sensitive customer secrets

Keys must be stored separately from encrypted data.

---

## 16.4 Key Management

Encryption keys must:

- Use managed key services where possible
- Be separated by environment
- Be rotated
- Have limited access
- Be audited
- Never be stored in source control
- Support emergency revocation

---

# 17. Secret Management

Secrets include:

- Database passwords
- API keys
- Signing keys
- OAuth client secrets
- SMTP credentials
- Cloud credentials
- Encryption keys
- Webhook secrets
- Third-party integration credentials

Never store secrets in:

- Source control
- Frontend code
- Mobile bundles
- Logs
- Documentation
- Test fixtures
- Public environment files
- Screenshots
- Issue trackers

Use managed secret storage where possible.

Support:

- Rotation
- Environment separation
- Least privilege
- Expiration
- Access logging
- Emergency revocation

---

# 18. Logging and Audit Trails

## 18.1 Security Logging

Log significant security events:

- Login success
- Login failure
- Logout
- Password reset
- MFA changes
- Role changes
- Permission changes
- Session revocation
- Token reuse
- Access denial
- Export activity
- Sensitive record access
- Administrative actions
- Integration credential changes
- Support impersonation
- Suspicious rate-limit events

---

## 18.2 Business Audit Trail

Sensitive business changes should record:

- Actor
- Tenant
- Action
- Resource type
- Resource ID
- Timestamp
- Previous state where appropriate
- New state where appropriate
- Correlation ID
- Source IP where appropriate
- Device or client information where appropriate
- Reason or comment where required

Examples:

- Pay rate changed
- Billing rate changed
- Load closed
- Load reopened
- Time entry changed
- Payroll approved
- Invoice generated
- User role changed
- Employee removed from a load
- Customer pricing changed

---

## 18.3 Log Safety

Never log:

- Passwords
- Access tokens
- Refresh tokens
- Password reset tokens
- Full banking details
- Secret keys
- Sensitive request bodies
- Government identifiers
- Highly sensitive personal information

Mask sensitive values.

---

## 18.4 Audit Integrity

Audit records should be difficult for normal application users to modify or delete.

Use:

- Restricted access
- Append-only storage where appropriate
- Separate audit permissions
- Retention rules
- Export protections
- Monitoring for audit deletion attempts

---

# 19. Monitoring and Threat Detection

Monitor for:

- Repeated login failures
- Credential stuffing patterns
- Cross-tenant access attempts
- Repeated permission denials
- Token reuse
- Unusual exports
- Large data downloads
- Rapid enumeration of IDs
- Excessive API requests
- Unexpected administrative actions
- Sudden role changes
- Access from unusual devices or locations
- Repeated password resets
- Unusual file upload patterns
- Unexpected integration activity

Security alerts should be actionable and avoid unnecessary noise.

---

# 20. Database Security

Use separate database identities for:

- Application runtime
- Migrations
- Reporting
- Administration
- Background processing where appropriate

The application runtime user should not normally be able to:

- Drop databases
- Change schemas
- Create privileged users
- Disable audit controls
- Access unrelated databases
- Bypass row-level security without justification

Use:

- Foreign keys
- Constraints
- Transactions
- Safe migrations
- Encrypted backups
- Restricted backup access
- Restore testing
- Query timeouts
- Connection limits

---

# 21. Row-Level Security

Where supported, row-level security may provide an additional tenant-isolation layer.

Application authorization is still required.

Row-level security should:

- Use trusted tenant context
- Deny by default
- Apply to read and write operations
- Be covered by automated tests
- Avoid privileged connections that bypass policies unintentionally
- Be reviewed during migrations

---

# 22. Search Security

Search endpoints must enforce the same authorization as direct record endpoints.

Do not return records the user cannot access normally.

Search results must be filtered by:

- Tenant
- Role
- Permission
- Warehouse scope
- Customer scope
- Resource ownership
- Field sensitivity

Search indexes must not contain unprotected cross-tenant data.

---

# 23. Export and Reporting Security

Exports often contain more data than standard screens.

For exports:

- Require explicit permission
- Apply tenant filters
- Apply field restrictions
- Limit export size
- Audit the export
- Use expiring download links
- Avoid predictable public URLs
- Protect generated files
- Delete temporary exports after expiration
- Consider reauthentication for sensitive exports
- Apply rate limits
- Watermark where appropriate
- Prevent unauthorized sharing where practical

---

# 24. Webhook Security

Incoming webhooks should use:

- Signature verification
- Timestamp validation
- Replay protection
- Secret rotation
- Schema validation
- Source restrictions where practical
- Idempotency
- Rate limiting
- Payload size limits

Outgoing webhooks should:

- Sign payloads
- Avoid unnecessary sensitive data
- Use HTTPS
- Retry safely
- Apply timeouts
- Avoid arbitrary redirects
- Record delivery attempts
- Support secret rotation
- Avoid leaking secrets in logs

---

# 25. Server-Side Request Forgery Prevention

Any feature that fetches a user-provided URL must protect against SSRF.

Controls:

- Allowlist approved hosts
- Block private IP ranges
- Block cloud metadata addresses
- Resolve DNS safely
- Revalidate after redirects
- Restrict protocols
- Apply timeouts
- Limit response size
- Use isolated networking where possible
- Prevent access to internal services

---

# 26. Dependency and Supply Chain Security

Maintain:

- Dependency lock files
- Automated vulnerability scanning
- Dependency update tooling
- Update policies
- Review of high-risk packages
- Restricted package installation
- Reproducible builds where practical
- Software bill of materials where required
- Package integrity verification
- CI checks for known vulnerabilities

Do not add libraries for trivial functionality without evaluating security and maintenance risks.

---

# 27. Environment Separation

Maintain strict separation between:

- Development
- Testing
- Staging
- Production

Do not:

- Use production secrets in development
- Copy production personal data into lower environments without anonymization
- Allow development services to access production databases
- Share unrestricted credentials across environments

Production access must be restricted and auditable.

---

# 28. Administrative Security

Administrative features require stronger protection.

Recommended controls:

- MFA
- Shorter session lifetimes
- Reauthentication
- Detailed audit logs
- Separate permission sets
- Limited administrator count
- Inactive administrator reviews
- Alerts for role changes
- Restricted exports
- Explicit support access
- Approval for critical privilege changes

Platform administrators must not casually access tenant data.

---

# 29. Impersonation and Support Access

When impersonation is implemented:

- Require explicit permission
- Require a reason
- Record original administrator identity
- Display a persistent impersonation banner
- Prevent selected sensitive actions
- Log start and end
- Use short session duration
- Notify or report access according to policy
- Preserve the original actor in all audit records

Never replace the audit actor with the impersonated user.

---

# 30. Business Logic Security

Security includes protecting workflows from valid-looking but unauthorized actions.

Examples:

- Closing a load twice
- Editing a closed payroll period
- Approving one's own restricted action
- Assigning employees to unrelated warehouses
- Changing rates after payroll approval
- Generating duplicate invoices
- Bypassing required states
- Submitting impossible time ranges
- Modifying calculated totals directly
- Reopening completed workflows without permission
- Clocking out an employee who was never clocked in

Enforce business rules on the backend.

Do not rely on disabled frontend controls.

---

# 31. Concurrency and Race Conditions

Sensitive operations must handle concurrent requests safely.

Use:

- Database transactions
- Optimistic locking
- Pessimistic locking where justified
- Unique constraints
- Idempotency keys
- Atomic updates
- Status preconditions
- Version fields

Examples:

- Load closure
- Payroll approval
- Invoice generation
- Employee clock-in
- Employee clock-out
- Assignment changes
- Rate updates
- Bulk imports

---

# 32. Mobile Application Security

The mobile application must:

- Use secure platform storage
- Avoid storing sensitive data unnecessarily
- Clear sensitive state after logout
- Encrypt required offline data
- Avoid logging tokens and personal data
- Detect expired sessions
- Revalidate permissions after reconnecting
- Validate deep links
- Restrict screenshots for highly sensitive screens where justified
- Avoid secrets in the application bundle
- Use certificate validation
- Protect local databases
- Avoid trusting rooted or jailbroken devices as a sole control
- Support remote session revocation

Offline actions must be revalidated by the backend during synchronization.

---

# 33. Offline Data Security

When offline functionality is implemented:

- Cache only necessary data
- Encrypt sensitive cached data
- Apply user and tenant ownership
- Delete cached data after logout
- Expire cached records
- Prevent cross-account data reuse
- Revalidate all queued actions
- Detect conflicts
- Audit synchronized actions
- Avoid exposing confidential data through device backups

---

# 34. Security Testing

Automated security tests should include:

- Anonymous endpoint access
- Expired token access
- Revoked token access
- Wrong-tenant access
- Wrong-warehouse access
- Wrong-customer access
- Missing permission
- Role escalation attempts
- Object ID manipulation
- Mass assignment
- Sensitive field exposure
- Invalid token audience
- Invalid token issuer
- Invalid token algorithm
- File upload validation
- Rate-limit behavior
- CSRF protection
- CORS restrictions
- Refresh token reuse
- Session revocation
- Search isolation
- Export isolation
- Background job isolation
- WebSocket isolation
- Concurrency behavior

Every endpoint accepting an object identifier should include negative authorization tests.

---

# 35. Security Review Checklist for New Endpoints

Before releasing a new endpoint, verify:

- Is authentication required?
- Which permission is required?
- Which tenant owns the resource?
- Is object-level authorization enforced?
- Is warehouse or customer scope required?
- Are writable fields explicitly allowlisted?
- Are response fields explicitly allowlisted?
- Is validation complete?
- Is rate limiting required?
- Is audit logging required?
- Can the operation be duplicated?
- Does it expose sensitive information?
- Does it require recent authentication?
- Are negative authorization tests included?
- Is pagination bounded?
- Are sorting and filtering safe?
- Is the operation transactional?
- Are errors safe?
- Does it support revocation?
- Does it affect cached permissions?

---

# 36. Incident Response Readiness

The platform should support response to suspected compromise.

Required capabilities:

- Revoke one session
- Revoke all user sessions
- Revoke all tenant sessions
- Rotate secrets
- Disable integrations
- Disable accounts
- Review audit logs
- Identify affected records
- Preserve evidence
- Notify relevant stakeholders
- Restore verified backups
- Suspend exports
- Restrict support access
- Force password resets
- Force MFA enrollment where needed

Maintain a documented incident response process.

---

# 37. Data Retention and Deletion

Define retention rules for:

- Audit logs
- Authentication logs
- Payroll data
- Billing data
- Uploaded files
- Temporary exports
- Deleted records
- Backups
- Integration logs
- Security events
- Offline mobile data

Deletion must consider:

- Legal obligations
- Contract requirements
- Security investigations
- Financial retention
- Customer requests
- Backup lifecycle
- Employee privacy

Soft deletion must not expose deleted records through normal queries.

---

# 38. Privacy by Design

Collect only data required for the product.

For every sensitive field, document:

- Why it is collected
- Who can access it
- Where it is stored
- How it is encrypted
- How long it is retained
- Whether it appears in exports
- Whether it is sent to third parties
- How it is deleted
- Whether it is required or optional

Avoid collecting sensitive information without a defined business purpose.

---

# 39. Security Documentation

Maintain:

- Permission matrix
- Role definitions
- Data classification
- Tenant-isolation strategy
- Authentication architecture
- Session lifecycle
- Token lifecycle
- Threat model
- Incident response plan
- Backup and restoration procedure
- Secret rotation procedure
- Integration security requirements
- Support access procedure
- Audit-log policy
- Data-retention policy

Update documentation when authorization, authentication, networking, or data handling changes.

---

# 40. Security Definition of Done

A feature that handles data, identity, permissions, files, money, payroll, billing, reports, or integrations is not complete until:

- Authentication is enforced
- Session validation is implemented
- Authorization is enforced
- Tenant isolation is enforced
- Warehouse and customer scope are considered
- Object-level access is tested
- Field-level exposure is reviewed
- Writable fields are allowlisted
- Inputs are validated
- Outputs are restricted
- Sensitive activity is audited
- Errors do not expose internal details
- Rate limiting is considered
- Tokens and sessions are handled correctly
- Concurrency risks are considered
- Security tests are included
- Documentation is updated

---

# Final Engineering Rule

Security is not a frontend feature, middleware checkbox, or final QA task.

Every request must be treated as potentially malicious.

Every identifier must be treated as untrusted.

Every protected operation must independently verify:

- Identity
- Session
- Tenant
- Permission
- Resource ownership
- Warehouse scope
- Customer scope
- Allowed fields
- Workflow state
- Data sensitivity

A user must never gain access to a record merely because they know or can guess its identifier.

A user must never gain access to a function because the frontend hides or exposes it incorrectly.

A user must never be able to change protected properties by adding unexpected fields to a request.

Authentication confirms identity.

Authorization must still be enforced for every resource and every action.

Security controls must exist on the backend, even when similar restrictions exist in the web or mobile interface.

No frontend, mobile, backend, API, integration, reporting, or infrastructure feature should be considered production-ready until its authentication, authorization, tenant isolation, data exposure, token handling, auditability, networking, failure behavior, and abuse resistance have been intentionally designed, implemented, and tested.