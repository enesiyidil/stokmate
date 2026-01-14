package com.stokmate.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Subselect;

@Entity
@Immutable
@Subselect("SELECT CAST(oa.id AS varchar) as id, " +
        "       'ORDER' as domain, " +
        "       CAST(oa.activity_type AS varchar) as activity_type, " +
        "       oa.description as description, " +
        "       oa.created_at as created_at, " +
        "       oa.user_id as user_id, " +
        "       u.first_name || ' ' || u.last_name as user_full_name, " +
        "       u.email as user_email, " +
        "       CAST(oa.order_id AS varchar) as reference_id, " +
        "       o.order_no as reference_no " +
        "FROM order_activities oa " +
        "JOIN users u ON oa.user_id = u.id " +
        "JOIN orders o ON oa.order_id = o.id " +
        "UNION ALL " +
        "SELECT CAST(se.id AS varchar) as id, " +
        "       'SALE' as domain, " +
        "       CAST(se.event_type AS varchar) as activity_type, " +
        "       se.description as description, " +
        "       se.created_at as created_at, " +
        "       se.user_id as user_id, " +
        "       u.first_name || ' ' || u.last_name as user_full_name, " +
        "       u.email as user_email, " +
        "       CAST(se.sale_id AS varchar) as reference_id, " +
        "       s.sale_no as reference_no " +
        "FROM sale_events se " +
        "LEFT JOIN users u ON se.user_id = u.id " +
        "JOIN sales s ON se.sale_id = s.id")
@Getter
public class BusinessActivity {

    @Id
    private String id;

    private String domain; // ORDER, SALE

    private String activityType;

    private String description;

    private LocalDateTime createdAt;

    private UUID userId;

    private String userFullName;

    private String userEmail;

    private String referenceId; // order_id or sale_id

    private String referenceNo; // order_no or sale_no
}
