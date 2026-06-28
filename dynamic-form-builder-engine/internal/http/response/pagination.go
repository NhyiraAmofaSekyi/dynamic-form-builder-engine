package response

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

const (
	defaultPage     = 1
	defaultPageSize = 20
	maxPageSize     = 100
)

// Params holds validated pagination input. Build it from a request with
// FromQuery; never construct page/size by hand in handlers.
type Params struct {
	Page     int // 1-based
	PageSize int // capped at maxPageSize
}

// Limit is the SQL LIMIT value.
func (p Params) Limit() int32 {
	return int32(p.PageSize)
}

// Offset is the SQL OFFSET value (how many rows to skip).
func (p Params) Offset() int32 {
	return int32((p.Page - 1) * p.PageSize)
}

// FromQuery parses ?page= and ?page_size= from the request, applying defaults
// and clamping so a client can't request page_size=1000000. Invalid values
// fall back to defaults rather than erroring — pagination should be forgiving.
func FromQuery(c *gin.Context) Params {
	page := atoiOr(c.Query("page"), defaultPage)
	if page < 1 {
		page = defaultPage
	}

	size := atoiOr(c.Query("page_size"), defaultPageSize)
	if size < 1 {
		size = defaultPageSize
	}
	if size > maxPageSize {
		size = maxPageSize
	}

	return Params{Page: page, PageSize: size}
}

// Page is the response envelope: the items plus the metadata a client needs to
// render pagination controls. Generic over the item type so any list reuses it.
type Page[T any] struct {
	Items      []T   `json:"items"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalItems int64 `json:"total_items"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

// NewPage assembles the envelope from the fetched items, the params used, and
// the total row count (from a separate COUNT query).
func NewPage[T any](items []T, p Params, total int64) Page[T] {
	if items == nil {
		items = []T{} // serialize as [] not null
	}
	totalPages := int((total + int64(p.PageSize) - 1) / int64(p.PageSize)) // ceil
	return Page[T]{
		Items:      items,
		Page:       p.Page,
		PageSize:   p.PageSize,
		TotalItems: total,
		TotalPages: totalPages,
		HasNext:    p.Page < totalPages,
		HasPrev:    p.Page > 1,
	}
}

func atoiOr(s string, fallback int) int {
	if s == "" {
		return fallback
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return fallback
	}
	return n
}
