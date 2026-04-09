export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  image: string | null;
  price: number;
  sku: string;
  optionLabel: string;
  quantity: number;
  slug: string;
}
