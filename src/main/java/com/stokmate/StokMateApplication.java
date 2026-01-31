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
            } catch (Exception e) {
                e.printStackTrace();
            }
        };
    }
}
