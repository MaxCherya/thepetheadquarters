export interface Brand {
  id: string;
  slug: string;
  name: string;
  logo: string;
}

export interface BrandDetail extends Brand {
  description: string;
  website: string;
  translations: BrandTranslation[];
}

export interface BrandTranslation {
  language: string;
  name: string;
  description: string;
}
