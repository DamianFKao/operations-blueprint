# api/engine

The keystone. cost() is the ONE place a price is computed. Build it first. Every quote, catalog
price, and report calls it; nothing prices on its own. If you need a price somewhere, import cost().
