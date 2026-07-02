"""Delivery scheduling tied back to the project record."""
from fastapi import APIRouter

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


# TODO: schedule deliveries with a simple status flow tied to the project.
