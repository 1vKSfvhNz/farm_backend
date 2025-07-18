from pydantic import BaseModel, Field
from typing import List, Generic, TypeVar

T = TypeVar("T")

class Pagination(BaseModel):
    current_page: int = Field(..., alias="currentPage")
    total_pages: int = Field(..., alias="totalPages")
    total_items: int = Field(..., alias="totalItems")
    items_per_page: int = Field(..., alias="itemsPerPage")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    pagination: Pagination
