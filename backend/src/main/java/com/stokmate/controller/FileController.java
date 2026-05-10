package com.stokmate.controller;

import com.stokmate.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;

/**
 * Controller to proxy file requests from MinIO storage.
 * This allows the frontend to access files through the backend,
 * avoiding CORS issues and direct MinIO access in production.
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final StorageService storageService;

    /**
     * Download/view a file from storage.
     * Example: GET /api/files/view?path=invoices/1234.pdf
     */
    @GetMapping("/view")
    public ResponseEntity<InputStreamResource> viewFile(@RequestParam String path) {
        try {
            InputStream inputStream = storageService.download(path);

            // Determine content type based on file extension
            String contentType = getContentType(path);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + getFileName(path) + "\"")
                    .body(new InputStreamResource(inputStream));
        } catch (Exception e) {
            log.error("Failed to download file: {}", path, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Download a file as attachment.
     * Example: GET /api/files/download?path=invoices/1234.pdf
     */
    @GetMapping("/download")
    public ResponseEntity<InputStreamResource> downloadFile(@RequestParam String path) {
        try {
            InputStream inputStream = storageService.download(path);

            String contentType = getContentType(path);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + getFileName(path) + "\"")
                    .body(new InputStreamResource(inputStream));
        } catch (Exception e) {
            log.error("Failed to download file: {}", path, e);
            return ResponseEntity.notFound().build();
        }
    }

    private String getContentType(String path) {
        String lowerPath = path.toLowerCase();
        if (lowerPath.endsWith(".pdf")) {
            return "application/pdf";
        } else if (lowerPath.endsWith(".png")) {
            return "image/png";
        } else if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerPath.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerPath.endsWith(".webp")) {
            return "image/webp";
        } else if (lowerPath.endsWith(".svg")) {
            return "image/svg+xml";
        } else if (lowerPath.endsWith(".xlsx")) {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else if (lowerPath.endsWith(".xls")) {
            return "application/vnd.ms-excel";
        } else if (lowerPath.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (lowerPath.endsWith(".doc")) {
            return "application/msword";
        } else {
            return "application/octet-stream";
        }
    }

    private String getFileName(String path) {
        if (path == null)
            return "file";
        int lastSlash = path.lastIndexOf('/');
        return lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
    }
}
