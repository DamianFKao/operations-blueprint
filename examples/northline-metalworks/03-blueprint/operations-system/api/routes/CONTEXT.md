# api/routes

HTTP surfaces, one module per domain. Thin by design: parse input, call engine.cost() or a service,
persist through the API, return. No pricing or business rules inline here.
