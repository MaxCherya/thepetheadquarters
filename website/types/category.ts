export interface Category {
  id: string;
  slug: string;
  name: string;
  image: string;
  depth: number;
  parent: string | null;
}

export interface CategoryDetail extends Category {
  path: string;
  description: string;
  meta_title: string;
  meta_description: string;
  translations: CategoryTranslation[];
  children: Category[];
}

export interface CategoryTranslation {
  language: string;
  name: string;
  description: string;
}
