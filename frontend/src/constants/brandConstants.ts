// Brand types and utilities
export type Brand = 'OAK' | 'PINE' | 'MAPLE';

// Brand color mappings - specific colors for each brand
export const BRAND_COLORS: Record<Brand, string> = {
    OAK: '#5D4037',   // Dark Brown (Koyu Kahve)
    PINE: '#00ACC1',     // Turquoise (Turkuaz)
    MAPLE: '#D32F2F'   // Red (Kırmızı)
};

// Brand display labels
export const BRAND_LABELS: Record<Brand, string> = {
    OAK: 'Doğtaş',
    PINE: 'Pine',
    MAPLE: 'Maple'
};

// All available brands
export const BRANDS: Brand[] = ['OAK', 'PINE', 'MAPLE'];

// Helper function to get brand color
export function getBrandColor(brand: Brand | null | undefined): string {
    if (!brand) return '#9E9E9E'; // Gray for no brand
    return BRAND_COLORS[brand] || '#9E9E9E';
}

// Helper function to get brand label
export function getBrandLabel(brand: Brand | null | undefined): string {
    if (!brand) return 'Marka Yok';
    return BRAND_LABELS[brand] || brand;
}
