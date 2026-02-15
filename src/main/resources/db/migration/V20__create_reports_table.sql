CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_no VARCHAR(255) NOT NULL UNIQUE,
    report_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'GENERATING',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    filters TEXT,
    pdf_file_key VARCHAR(500),
    total_records INTEGER NOT NULL DEFAULT 0,
    total_revenue NUMERIC(19,2) DEFAULT 0,
    total_cost NUMERIC(19,2) DEFAULT 0,
    total_profit NUMERIC(19,2) DEFAULT 0,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
