"""Inventory. Decrement stock on consumption so quoting and purchasing read real on-hand levels."""
from fastapi import APIRouter

router = APIRouter(prefix="/inventory", tags=["inventory"])


# TODO: expose on_hand and decrement it as jobs consume material.
