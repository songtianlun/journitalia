package embedding

import (
	"context"
	"fmt"
	"path/filepath"
	"sync"

	chromem "github.com/philippgille/chromem-go"
	"github.com/songtianlun/diaria/internal/logger"
)

const (
	collectionName = "diaries"
)

// VectorDB manages the vector database for diary embeddings
type VectorDB struct {
	db         *chromem.DB
	dataDir    string
	mu         sync.RWMutex
	collection *chromem.Collection
}

// NewVectorDB creates a new VectorDB instance
func NewVectorDB(dataDir string) (*VectorDB, error) {
	dbPath := filepath.Join(dataDir, "vectors")
	logger.Debug("[VectorDB] initializing vector database at: %s", dbPath)

	db, err := chromem.NewPersistentDB(dbPath, false)
	if err != nil {
		return nil, fmt.Errorf("failed to create vector database: %w", err)
	}

	return &VectorDB{
		db:      db,
		dataDir: dataDir,
	}, nil
}

// GetOrCreateCollection gets or creates a collection for a user
func (v *VectorDB) GetOrCreateCollection(ctx context.Context, userID string, embeddingFunc chromem.EmbeddingFunc) (*chromem.Collection, error) {
	v.mu.Lock()
	defer v.mu.Unlock()

	collName := fmt.Sprintf("%s_%s", collectionName, userID)

	// Try to get existing collection
	collection := v.db.GetCollection(collName, embeddingFunc)
	if collection != nil {
		return collection, nil
	}

	// Create new collection
	collection, err := v.db.CreateCollection(collName, nil, embeddingFunc)
	if err != nil {
		return nil, fmt.Errorf("failed to create collection: %w", err)
	}

	return collection, nil
}

// DeleteCollection deletes a user's collection
func (v *VectorDB) DeleteCollection(userID string) error {
	v.mu.Lock()
	defer v.mu.Unlock()

	collName := fmt.Sprintf("%s_%s", collectionName, userID)
	return v.db.DeleteCollection(collName)
}

// GetCollection gets a collection for a user (read-only)
// Note: We use a placeholder embedding func to prevent chromem-go from setting
// the default OpenAI embedding func, which would override our custom func later.
func (v *VectorDB) GetCollection(userID string) *chromem.Collection {
	v.mu.RLock()
	defer v.mu.RUnlock()

	collName := fmt.Sprintf("%s_%s", collectionName, userID)
	// Use a placeholder func that returns an error if called.
	// This prevents chromem-go from using the default OpenAI func.
	placeholderFunc := func(ctx context.Context, text string) ([]float32, error) {
		return nil, fmt.Errorf("placeholder embedding func called - this should not happen")
	}
	return v.db.GetCollection(collName, placeholderFunc)
}

// Close closes the vector database
func (v *VectorDB) Close() error {
	// chromem-go doesn't have a Close method, but we keep this for future compatibility
	return nil
}
