export interface Brand {
  id: string;
  slug: string;
  name: string;
  logo: string;
}

export interface BrandDetail extends Brand {
  description: string;
  website: string;
  meta_title: string;
  meta_description: string;
  translations: BrandTranslation[];
}

export interface BrandTranslation {
  language: string;
  name: string;
  description: string;
}
