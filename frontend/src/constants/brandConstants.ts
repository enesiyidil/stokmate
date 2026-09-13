// Sample brand catalog for the open-source seed. Replace these with your own labels.
export type Brand = 'OAK' | 'PINE' | 'MAPLE';
export type BrandFilter = 'ALL' | Brand | 'MARKASIZ';

export const BRAND_COLORS: Record<Brand, string> = {
    OAK: '#5D4037',
    PINE: '#00ACC1',
    MAPLE: '#D32F2F',
};

export const BRAND_LABELS: Record<Brand, string> = {
    OAK: 'Oak',
    PINE: 'Pine',
    MAPLE: 'Maple',
};

export const BRANDS: Brand[] = ['OAK', 'PINE', 'MAPLE'];

export const BRAND_CHIP_COLORS: Record<Brand, string> = {
    OAK: 'bg-amber-800',
    PINE: 'bg-cyan-600',
    MAPLE: 'bg-red-600',
};

export const BRAND_ONLY_FILTER_OPTIONS: { key: string; label: string; activeColor?: string }[] = [
    { key: 'ALL', label: 'Tümü' },
    ...BRANDS.map((key) => ({
        key,
        label: BRAND_LABELS[key],
        activeColor: BRAND_CHIP_COLORS[key],
    })),
];

export const BRAND_FILTER_OPTIONS: { key: BrandFilter; label: string; activeColor?: string }[] = [
    ...BRAND_ONLY_FILTER_OPTIONS,
    { key: 'MARKASIZ', label: 'Markasız', activeColor: 'bg-gray-600' },
];

export const BRAND_STOCK_SHORTCUTS = BRANDS.map((brand) => ({
    title: `${BRAND_LABELS[brand]} Stok`,
    path: `/products?brand=${brand}`,
    color: brand === 'OAK' ? 'amber' : brand === 'MAPLE' ? 'red' : 'blue',
}));

export function getBrandColor(brand: Brand | null | undefined): string {
    if (!brand) return '#9E9E9E';
    return BRAND_COLORS[brand] || '#9E9E9E';
}

export function getBrandLabel(brand: Brand | string | null | undefined): string {
    if (!brand) return 'Marka Yok';
    if (brand === 'MARKASIZ') return 'Markasız';
    return BRAND_LABELS[brand as Brand] || brand;
}

export function getBrandBadgeClass(brand: Brand | string | null | undefined): string {
    switch (brand) {
        case 'OAK':
            return 'bg-amber-50 text-amber-800 border-amber-100';
        case 'PINE':
            return 'bg-cyan-50 text-cyan-700 border-cyan-100';
        case 'MAPLE':
            return 'bg-red-50 text-red-700 border-red-100';
        default:
            return 'bg-gray-50 text-gray-600 border-gray-100';
    }
}
