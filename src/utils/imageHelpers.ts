// src/utils/imageHelpers.ts

/**
 * Generates the full URL for a storage image from Laravel backend
 * @param imagePath - Relative path from storage (e.g., "products/image.png")
 * @param fallbackUrl - Optional fallback image URL
 * @returns Full URL to the image or fallback
 */
export const getStorageImageUrl = (
    imagePath: string | null | undefined,
    fallbackUrl = 'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZsb3dlcnN8ZW58MHwxfDB8fHww&auto=format&fit=crop&q=60&ixlib=rb-4.1.0'
): string => {
    if (!imagePath) return fallbackUrl;

    // If already a full URL, return as is
    if (imagePath.startsWith('http://storage') || imagePath.startsWith('https://storage')) {
        return imagePath;
    }

    // Get base URL from environment and construct storage URL
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const baseUrl = apiUrl.replace(/\/api\/?$/, ''); 

    return `${baseUrl}/storage/${imagePath}`;
};

/**
 * Gets the primary product image URL from product object
 * Handles multiple possible image field structures
 */
export const getProductImageUrl = (product: {
    primary_image?: { image_path?: string } | null;
    image?: string;
    image_url?: string;
}): string => {
    const imagePath =
        product.primary_image?.image_path ||
        product.image ||
        product.image_url;

    return getStorageImageUrl(imagePath);
};

/**
 * Gets category image URL
 */
export const getCategoryImageUrl = (category: {
    image?: string;
}): string => {
    return getStorageImageUrl(category.image);
};