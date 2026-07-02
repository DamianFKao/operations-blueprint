"""Quote builder. Quotes are versioned; every line is priced by the one engine."""
from fastapi import APIRouter

from ..engine.cost import cost

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.post("")
def create_quote(payload: dict) -> dict:
    """
    For each line: price it with cost(product_ref, options).
    Persist quotes + quote_lines as a new version, total it, and return the quote.
    Internal and customer-facing quoting both go through here, so they cannot disagree.
    """
    # TODO: implement
    raise NotImplementedError


@router.get("/{quote_id}")
def get_quote(quote_id: int) -> dict:
    # TODO: load quote + quote_lines
    raise NotImplementedError
