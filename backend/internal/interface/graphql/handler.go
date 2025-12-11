package graphapi

import (
	"net/http"

	"github.com/gin-gonic/gin"
	gql "github.com/graphql-go/graphql"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

// Handler wraps a compiled GraphQL schema and exposes a Gin-compatible handler.
type Handler struct {
	schema gql.Schema
}

// NewHandler builds the GraphQL schema using the provided services.
func NewHandler(workoutSvc usecase.WorkoutService) (*Handler, error) {
	schema, err := buildSchema(workoutSvc)
	if err != nil {
		return nil, err
	}
	return &Handler{schema: schema}, nil
}

type requestBody struct {
	Query         string         `json:"query"`
	Variables     map[string]any `json:"variables"`
	OperationName string         `json:"operationName"`
}

// ServeGraphQL executes GraphQL queries using the authenticated user context.
func (h *Handler) ServeGraphQL(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var body requestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query is required"})
		return
	}

	uid, _ := userIDVal.(uint)
	ctx := WithUserID(c.Request.Context(), uid)

	result := gql.Do(gql.Params{
		Schema:         h.schema,
		RequestString:  body.Query,
		VariableValues: body.Variables,
		OperationName:  body.OperationName,
		Context:        ctx,
	})

	status := http.StatusOK
	if len(result.Errors) > 0 {
		// bad user input -> 400, otherwise keep 200
		status = http.StatusBadRequest
	}
	c.JSON(status, result)
}
