# API Documentation

## Overview

This project uses an OpenAPI specification to generate type-safe API clients for React applications. The API is defined in `lib/api-spec/openapi.yaml` and clients are automatically generated using Orval.

## Base Configuration

### Base URL
- **Default Base URL**: `/api`
- **Configurable**: Use `setBaseUrl()` to override for different environments

### Authentication
- **Type**: Bearer Token
- **Setup**: Use `setAuthTokenGetter()` to provide authentication tokens
- **Note**: For web applications with cookie-based sessions, auth tokens are typically not needed as the browser handles cookies automatically

## Available Endpoints

### Health Check

**Endpoint**: `GET /api/healthz`

**Description**: Returns server health status

**Tags**: health

**Response**:
```typescript
{
  status: string
}
```

**Status Codes**:
- `200`: Healthy

## Usage

### Installation

The API client libraries are located in:
- `lib/api-client-react` - React Query hooks
- `lib/api-zod` - Zod schemas for validation

### Setup

```typescript
import { setBaseUrl, setAuthTokenGetter } from "@/lib/api-client-react";

// Set custom base URL (optional, for Expo/mobile apps)
setBaseUrl("https://api.example.com");

// Set auth token getter (optional, for token-based auth)
setAuthTokenGetter(async () => {
  // Return your auth token
  return "your-bearer-token";
});
```

### Using React Query Hooks

```typescript
import { useHealthCheck } from "@/lib/api-client-react";

function HealthCheckComponent() {
  const { data, isLoading, error } = useHealthCheck();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Status: {data?.status}</div>;
}
```

### Using Direct API Calls

```typescript
import { healthCheck } from "@/lib/api-client-react";

async function checkHealth() {
  try {
    const result = await healthCheck();
    console.log("Health status:", result.status);
  } catch (error) {
    console.error("Health check failed:", error);
  }
}
```

### Using Zod Schemas

```typescript
import { HealthCheckResponse } from "@/lib/api-zod";

// Validate response data
const validatedData = HealthCheckResponse.parse({
  status: "ok"
});
```

## Error Handling

The API client throws `ApiError` for failed requests:

```typescript
import { ApiError } from "@/lib/api-client-react";

try {
  await healthCheck();
} catch (error) {
  if (error instanceof ApiError) {
    console.error("API Error:", {
      status: error.status,
      statusText: error.statusText,
      data: error.data,
      message: error.message
    });
  }
}
```

## Generated Files

### React Query Client (`lib/api-client-react/src/generated/`)
- `api.ts` - API functions and React Query hooks
- `api.schemas.ts` - TypeScript types

### Zod Schemas (`lib/api-zod/src/generated/`)
- `api.ts` - Zod schemas for request/response validation
- `types/` - Generated TypeScript types

## Custom Fetch Configuration

The API client uses a custom fetch implementation (`custom-fetch.ts`) that provides:
- Automatic base URL prepending
- Bearer token injection
- Response type handling (json, text, blob)
- Error parsing and formatting
- Support for different runtimes (browser, React Native)

## Adding New Endpoints

To add new API endpoints:

1. **Edit the OpenAPI spec**: Add your endpoint to `lib/api-spec/openapi.yaml`
2. **Regenerate clients**: Run the Orval generation script
3. **Use the generated hooks**: Import and use the new hooks in your components

Example OpenAPI addition:
```yaml
paths:
  /users:
    get:
      operationId: getUsers
      tags: [users]
      summary: Get all users
      responses:
        "200":
          description: List of users
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/User"
```

## Project Structure

```
lib/
├── api-spec/              # OpenAPI specification
│   ├── openapi.yaml       # API definition
│   └── orval.config.ts    # Orval configuration
├── api-client-react/      # React Query client
│   └── src/
│       ├── custom-fetch.ts # Custom fetch implementation
│       ├── generated/      # Auto-generated React Query hooks
│       └── index.ts       # Public exports
└── api-zod/               # Zod schemas
    └── src/
        ├── generated/     # Auto-generated Zod schemas
        └── index.ts       # Public exports
```

## Development

### Regenerating API Clients

When the OpenAPI spec changes, regenerate the clients using Orval:
```bash
cd lib/api-spec
npx orval
```

### Type Safety

All API calls are fully typed based on the OpenAPI specification. TypeScript will provide autocomplete and type checking for:
- Request parameters
- Request bodies
- Response data
- Error types

## Best Practices

1. **Use React Query hooks** for data fetching in React components
2. **Validate responses** with Zod schemas when needed
3. **Handle errors** gracefully with try-catch blocks
4. **Set base URL** only for mobile/Expo apps (not needed for web)
5. **Use auth token getter** only for token-based authentication (not for cookie-based sessions)
