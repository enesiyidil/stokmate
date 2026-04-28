-- Add problem resolution fields to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS problem_resolved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS resolution_type VARCHAR(50);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS resolution_description TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS resolved_by_id UUID REFERENCES users(id);

-- Create resolution photos collection table
CREATE TABLE IF NOT EXISTS shipment_resolution_photos (
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    photo_path VARCHAR(500) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipment_resolution_photos_shipment_id ON shipment_resolution_photos(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_problem_resolved ON shipments(problem_resolved);
