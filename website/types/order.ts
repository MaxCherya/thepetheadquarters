export interface OrderItem {
  id: string;
  product_name: string;
  variant_sku: string;
  variant_option_label: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url: string;
  fulfillment_status: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  email: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  paid_at: string | null;
  items: OrderItem[];
  shipping_full_name: string;
  shipping_address_line_1: string;
  shipping_address_line_2: string;
  shipping_city: string;
  shipping_county: string;
  shipping_postcode: string;
  shipping_country: string;
}

export interface OrderListItem {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  item_count: number;
}
