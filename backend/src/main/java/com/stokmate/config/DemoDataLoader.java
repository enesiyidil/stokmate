package com.stokmate.config;

import com.stokmate.domain.Brand;
import com.stokmate.domain.Product;
import com.stokmate.domain.Store;
import com.stokmate.repository.ProductRepository;
import com.stokmate.repository.StoreRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("demo")
@Order(100)
@RequiredArgsConstructor
public class DemoDataLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);

    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (storeRepository.count() == 0) {
            storeRepository.save(sampleStore("Downtown Showroom", "STORE-01", "100 Main Street"));
            storeRepository.save(sampleStore("Warehouse North", "WH-01", "50 Industrial Ave"));
            log.info("Demo stores created");
        }
        if (productRepository.count() == 0) {
            productRepository.save(sampleProduct("OAK-SOFA-01", "Oak Sofa 3-seat", Brand.OAK, new BigDecimal("12")));
            productRepository.save(sampleProduct("PINE-TBL-01", "Pine Dining Table", Brand.PINE, new BigDecimal("8")));
            productRepository.save(sampleProduct("MAPLE-CHR-01", "Maple Accent Chair", Brand.MAPLE, new BigDecimal("20")));
            log.info("Demo products created");
        }
    }

    private Store sampleStore(String name, String code, String address) {
        Store store = new Store();
        store.setName(name);
        store.setCode(code);
        store.setAddress(address);
        store.setActive(true);
        return store;
    }

    private Product sampleProduct(String code, String name, Brand brand, BigDecimal stock) {
        Product product = new Product();
        product.setCode(code);
        product.setName(name);
        product.setBrand(brand);
        product.setDescription("Sample catalog item for local demos");
        product.setStockQuantity(stock);
        product.setArrivalPrice(new BigDecimal("100.00"));
        product.setVatRate(new BigDecimal("20.00"));
        product.setActiveForSale(true);
        product.setDeleted(false);
        product.setIsDeleted(false);
        return product;
    }
}
