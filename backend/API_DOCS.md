# GameVault API Documentation

## Interactive Swagger UI

When the server is running, visit:

```
http://localhost:3000/api/docs
```

This provides an interactive interface where you can explore and test every endpoint, including authentication flows.

## Raw OpenAPI JSON

The raw OpenAPI 3.0.3 specification is available at:

```
http://localhost:3000/api/docs.json
```

You can import this URL into Postman, Insomnia, or any OpenAPI-compatible tool.

## Regenerating a static spec file

To export the current spec as a JSON file without starting the server:

```bash
cd backend
npm run docs:generate
```

This writes `openapi.json` to the backend root.

## How documentation stays in sync

Documentation is generated **at runtime** from JSDoc `@openapi` annotations co-located with each route handler in `src/routes/*.ts`.  
When you change or add a route, simply update the annotation above the `router.<method>(...)` call — the Swagger UI will reflect the change on the next server start.

### Annotation format

```ts
/**
 * @openapi
 * /example:
 *   get:
 *     tags: [TagName]
 *     summary: Short description
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/example', controller);
```

### Adding a new schema

Shared schemas live in `src/config/swagger.ts` under `definition.components.schemas`. Add your schema there to reference it with `$ref: '#/components/schemas/YourSchema'` in any annotation.

## Authentication

The API uses **JWT Bearer tokens**. In Swagger UI, click the **Authorize** button and paste a token obtained from `POST /auth/login`. The `persistAuthorization` option keeps the token across page reloads.
