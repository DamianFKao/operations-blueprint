# db

schema.sql is the single source of truth. The spine runs:
materials -> bom_lines -> products -> quote_lines -> quotes -> projects -> clients.
Cost rolls up the left; sales roll down the right; production_actuals close the loop onto estimates.
Migrations are forward-only: never edit a shipped migration; add a new one.
