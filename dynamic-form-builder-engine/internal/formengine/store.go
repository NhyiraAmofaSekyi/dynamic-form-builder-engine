package formengine

//
//import (
//	"fmt"
//	"os"
//	"path/filepath"
//	"sync"
//
//	"github.com/santhosh-tekuri/jsonschema/v6"
//)
//
//// Store keeps the schema on disk AND a compiled copy in memory. Reads serve
//// from memory (fast); updates validate, write the file atomically, then swap
//// the cache. The RWMutex lets many readers run concurrently but serialises writes.
////
//// NOTE (design honesty): this is a SINGLE mutable file — updating it overwrites
//// the previous schema in place. That's fine for getting the update flow working,
//// but it is exactly the "mutate app in place" pattern that loses history.
//// The versioned design (immutable form_versions rows in Postgres) replaces this.
//type Store struct {
//	path     string
//	mu       sync.RWMutex
//	raw      []byte
//	compiled *jsonschema.Schema
//}
//
//// NewStore reads and compiles the schema file once at startup.
//func NewStore(path string) (*Store, error) {
//	s := &Store{path: path}
//	if err := s.load(); err != nil {
//		return nil, err
//	}
//	return s, nil
//}
//
//func (s *Store) load() error {
//	raw, err := os.ReadFile(s.path)
//	if err != nil {
//		return fmt.Errorf("read schema file: %w", err)
//	}
//	compiled, err := Compile(raw)
//	if err != nil {
//		return fmt.Errorf("compile schema: %w", err)
//	}
//	s.mu.Lock()
//	s.raw, s.compiled = raw, compiled
//	s.mu.Unlock()
//	return nil
//}
//
//// Raw returns the raw schema bytes (served verbatim so x-* render hints and
//// key order survive). The returned slice is never mutated in place, so it's
//// safe to read without copying.
//func (s *Store) Raw() []byte {
//	s.mu.RLock()
//	defer s.mu.RUnlock()
//	return s.raw
//}
//
//// Schema returns the compiled schema for validation.
//func (s *Store) Schema() *jsonschema.Schema {
//	s.mu.RLock()
//	defer s.mu.RUnlock()
//	return s.compiled
//}
//
//// Update validates that newRaw is a compilable JSON Schema, writes it to disk
//// atomically (temp file + rename), then swaps the in-memory cache. If the new
//// schema is invalid, the file and cache are left UNTOUCHED.
//func (s *Store) Update(newRaw []byte) error {
//	// 1. Validate BEFORE touching disk — never persist a broken schema.
//	compiled, err := Compile(newRaw)
//	if err != nil {
//		return fmt.Errorf("not a valid JSON SchemaJson: %w", err)
//	}
//
//	// 2. Atomic write: write a temp file in the same dir, then rename over the
//	//    target. Rename is atomic on POSIX, so readers never see a half-written file.
//	dir := filepath.Dir(s.path)
//	tmp, err := os.CreateTemp(dir, "schema-*.json.tmp")
//	if err != nil {
//		return err
//	}
//	tmpName := tmp.Name()
//	defer os.Remove(tmpName) // no-op if the rename already consumed it
//
//	if _, err := tmp.Write(newRaw); err != nil {
//		tmp.Close()
//		return err
//	}
//	if err := tmp.Close(); err != nil {
//		return err
//	}
//	if err := os.Rename(tmpName, s.path); err != nil {
//		return err
//	}
//
//	// 3. Swap the cache only after the write succeeded.
//	s.mu.Lock()
//	s.raw, s.compiled = newRaw, compiled
//	s.mu.Unlock()
//	return nil
//}
