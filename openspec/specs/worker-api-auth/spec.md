# worker-api-auth Specification

## Purpose

Protects the production Worker API from unauthorized reads and writes once the repository becomes public, by requiring a shared secret on every request and limiting which origins the API responds to via CORS.

## Requirements

### Requirement: API requests must include a valid shared secret
The Worker API SHALL reject any request to a protected endpoint that does not include a valid `X-App-Secret` header matching the configured secret, except for the health check endpoint.

#### Scenario: Request without the secret header
- **WHEN** a client sends a request to any protected `/api/*` endpoint without an `X-App-Secret` header
- **THEN** the Worker responds with `401 Unauthorized` and does not perform the requested operation

#### Scenario: Request with an incorrect secret
- **WHEN** a client sends a request with an `X-App-Secret` header that does not match the configured secret
- **THEN** the Worker responds with `401 Unauthorized` and does not perform the requested operation

#### Scenario: Request with the correct secret
- **WHEN** a client sends a request with an `X-App-Secret` header matching the configured secret
- **THEN** the Worker processes the request normally and returns the existing response for that endpoint

#### Scenario: Health check remains reachable without a secret
- **WHEN** a client sends a request to `/api/health` without an `X-App-Secret` header
- **THEN** the Worker responds with its normal health check response, unaffected by the secret check

### Requirement: CORS restricted to known frontend origins
The Worker API SHALL only set CORS headers allowing cross-origin browser requests from explicitly configured frontend origins, not from any origin.

#### Scenario: Request from an allowed origin
- **WHEN** a browser sends a cross-origin request from a configured allowed origin
- **THEN** the Worker includes CORS headers permitting that origin to read the response

#### Scenario: Request from an unlisted origin
- **WHEN** a browser sends a cross-origin request from an origin not in the configured allow-list
- **THEN** the Worker does not include CORS headers permitting that origin to read the response

### Requirement: Frontend prompts once for the shared secret and persists it
The real (non-demo) frontend SHALL prompt the user for the shared secret when no valid secret is stored locally, and SHALL reuse the stored secret indefinitely on subsequent visits without re-prompting unless the server rejects it.

#### Scenario: First visit with no stored secret
- **WHEN** the user opens the app and no secret is stored in the browser
- **THEN** the app shows an unlock prompt and blocks data-loading API calls until a secret is provided

#### Scenario: Secret accepted
- **WHEN** the user submits a secret and the Worker accepts a subsequent request using it
- **THEN** the app stores the secret locally, dismisses the unlock prompt, and attaches the secret to all future requests without asking again

#### Scenario: Returning visit with a valid stored secret
- **WHEN** the user reopens the app on the same browser after previously unlocking it
- **THEN** the app attaches the stored secret to requests automatically and does not show the unlock prompt

#### Scenario: Stored secret is rejected
- **WHEN** a request using the stored secret receives a `401` response
- **THEN** the app clears the stored secret and shows the unlock prompt again
