# api

This service is the only writer to the database. Every surface (internal tools, customer views,
reports) goes through it, so logic lives here, never in clients. Keep routes thin: validate, call
the engine or a service, persist, return. Pricing belongs in engine/cost.py and nowhere else.
