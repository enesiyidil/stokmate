package com.stokmate.service;

import com.stokmate.dto.integration.WhatsappQueryRequest;
import com.stokmate.dto.integration.WhatsappQueryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WhatsappService {

    private final ProductService productService;

    public WhatsappQueryResponse query(WhatsappQueryRequest request) {
        var matches = productService.search(request.getText(), PageRequest.of(0, 5)).getContent();
        String answer = matches.isEmpty()
                ? "No matching products found"
                : "Found " + matches.size() + " matching products";
        return WhatsappQueryResponse.builder()
                .answer(answer)
                .matchedProducts(matches)
                .build();
    }
}
