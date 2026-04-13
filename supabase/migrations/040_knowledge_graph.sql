-- 040_knowledge_graph.sql
-- Knowledge Graph core tables: nodes and edges

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text NOT NULL CHECK (type IN (
                      'subject','topic','subtopic','pyq','current_affair',
                      'note','quiz','answer_framework','scheme',
                      'judgment','report','uploaded_material'
                    )),
  title             text NOT NULL,
  content           text,
  metadata          jsonb DEFAULT '{}',
  subject           text,
  syllabus_code     text,
  confidence_score  float DEFAULT 0.5,
  source_count      int DEFAULT 0,
  freshness_score   float DEFAULT 1.0,
  last_verified_at  timestamptz,
  human_approved    boolean DEFAULT false,
  version           int DEFAULT 1,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_nodes_type_idx      ON knowledge_nodes(type);
CREATE INDEX IF NOT EXISTS knowledge_nodes_subject_idx   ON knowledge_nodes(subject);
CREATE INDEX IF NOT EXISTS knowledge_nodes_code_idx      ON knowledge_nodes(syllabus_code);
CREATE INDEX IF NOT EXISTS knowledge_nodes_fresh_idx     ON knowledge_nodes(freshness_score);
CREATE INDEX IF NOT EXISTS knowledge_nodes_approved_idx  ON knowledge_nodes(human_approved);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id      uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  to_node_id        uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN (
                      'is_subtopic_of','appears_in_pyq','linked_to_ca',
                      'prereq_of','supports','explains',
                      'is_example_of','tagged_in_note','contradicts'
                    )),
  weight            float DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_edges_from_idx ON knowledge_edges(from_node_id);
CREATE INDEX IF NOT EXISTS knowledge_edges_to_idx   ON knowledge_edges(to_node_id);
CREATE INDEX IF NOT EXISTS knowledge_edges_type_idx ON knowledge_edges(relationship_type);
