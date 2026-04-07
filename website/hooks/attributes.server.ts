import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";

export interface ProductAttribute {
  attribute_key: string;
  attribute_name: string;
  display_value: string;
}

export async function getProductAttributes(
  productId: string,
  lang: string = "en",
): Promise<ProductAttribute[]> {
  return apiClient.getSuccess<ProductAttribute[]>(
    endpoints.attributes.byProduct(productId),
    { lang },
  );
}
