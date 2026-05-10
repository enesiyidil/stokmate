package com.stokmate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
@EnableScheduling
public class StokMateApplication {

    public static void main(String[] args) {
        SpringApplication.run(StokMateApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.CommandLineRunner schemaFixRunner(javax.sql.DataSource dataSource) {
        return args -> {
            try (java.sql.Connection conn = dataSource.getConnection();
                    java.sql.Statement stmt = conn.createStatement()) {
                try {
                    stmt.execute(
                            "ALTER TABLE products ADD COLUMN IF NOT EXISTS cancelled_stock_quantity DECIMAL(19,2) DEFAULT 0");
                    System.out.println("SCHEMA FIX: Successfully added cancelled_stock_quantity column");
                } catch (Exception e) {
                    System.out.println(
                            "SCHEMA FIX: Failed to add column (might already exist or other error): " + e.getMessage());
                }
                // Fix activity_type check constraint for cross conversion support
                try {
                    stmt.execute(
                            "ALTER TABLE order_activities DROP CONSTRAINT IF EXISTS order_activities_activity_type_check");
                    stmt.execute("ALTER TABLE order_activities ADD CONSTRAINT order_activities_activity_type_check " +
                            "CHECK (activity_type IN ('CREATED','COMPLETED','CANCELLED','INVOICE_UPLOADED','INVOICE_DELETED',"
                            +
                            "'PRODUCTS_ACCEPTED','PRODUCT_ACCEPTED','SHIPMENT_CREATED','SHIPMENT_UPDATED'," +
                            "'NOTE_ADDED','NOTE_STRIKETHROUGH','ORDER_UPDATED','SHIPMENT_APPROVED','SHIPMENT_CANCELLED',"
                            +
                            "'CROSS_CONVERSION_CREATED','CROSS_CONVERSION_UPDATED','CROSS_CONVERSION_DELETED',"
                            +
                            "'BALANCE_CREATED','BALANCE_PAYMENT_ADDED','BALANCE_UPDATED','BALANCE_DELETED','BALANCE_CLOSED'))");
                    System.out.println("SCHEMA FIX: Successfully updated activity_type check constraint");
                } catch (Exception e) {
                    System.out.println(
                            "SCHEMA FIX: Failed to update activity_type constraint: " + e.getMessage());
                }

                // Fix sale_events_event_type_check
                try {
                    stmt.execute(
                            "ALTER TABLE sale_events DROP CONSTRAINT IF EXISTS sale_events_event_type_check");
                    System.out.println("SCHEMA FIX: Successfully dropped sale_events_event_type_check");
                } catch (Exception e) {
                    System.out.println(
                            "SCHEMA FIX: Failed to drop sale_events_event_type_check constraint: " + e.getMessage());
                }

                // Fix notes content column type
                try {
                    stmt.execute(
                            "ALTER TABLE notes ALTER COLUMN content TYPE TEXT USING ENCODE(content::bytea, 'escape')");
                    System.out.println("SCHEMA FIX: Successfully altered notes.content TYPE to TEXT from bytea");
                } catch (Exception e) {
                    try {
                        stmt.execute("ALTER TABLE notes ALTER COLUMN content TYPE TEXT");
                        System.out.println("SCHEMA FIX: Successfully altered notes.content TYPE to TEXT");
                    } catch (Exception ex) {
                        System.out.println("SCHEMA FIX: Failed to alter notes content column: " + ex.getMessage());
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        };
    }
}
