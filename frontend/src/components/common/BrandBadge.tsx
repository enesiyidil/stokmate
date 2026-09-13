import { getBrandColor, getBrandLabel, type Brand } from '../../constants/brandConstants';

interface BrandBadgeProps {
    brand: Brand | null | undefined;
    className?: string;
}

export default function BrandBadge({ brand, className = '' }: BrandBadgeProps) {
    if (!brand) {
        return null;
    }

    const brandColor = getBrandColor(brand);
    const brandLabel = getBrandLabel(brand);

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${className}`}
            style={{ backgroundColor: brandColor }}
        >
            {brandLabel}
        </span>
    );
}
