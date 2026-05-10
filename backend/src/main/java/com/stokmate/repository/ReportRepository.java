package com.stokmate.repository;

import com.stokmate.domain.Report;
import com.stokmate.domain.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    List<Report> findAllByOrderByCreatedAtDesc();

    List<Report> findByReportTypeOrderByCreatedAtDesc(ReportType reportType);

    long countByReportType(ReportType reportType);
}
