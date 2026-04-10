import "server-only";

import type { Locale } from "./config";

import enCommon from "./dictionaries/en/common.json";
import enHome from "./dictionaries/en/home.json";
import enProducts from "./dictionaries/en/products.json";
import enProduct from "./dictionaries/en/product.json";
import enAbout from "./dictionaries/en/about.json";
import enContact from "./dictionaries/en/contact.json";
import enLegal from "./dictionaries/en/legal.json";
import enCart from "./dictionaries/en/cart.json";
import enAuth from "./dictionaries/en/auth.json";
import enCheckout from "./dictionaries/en/checkout.json";

type DictionaryMap = {
  common: typeof enCommon;
  home: typeof enHome;
  products: typeof enProducts;
  product: typeof enProduct;
  about: typeof enAbout;
  contact: typeof enContact;
  legal: typeof enLegal;
  cart: typeof enCart;
  auth: typeof enAuth;
  checkout: typeof enCheckout;
};

export type Namespace = keyof DictionaryMap;

const namespaces: Record<Locale, { [K in Namespace]: () => Promise<DictionaryMap[K]> }> = {
  en: {
    common: () => import("./dictionaries/en/common.json").then((m) => m.default),
    home: () => import("./dictionaries/en/home.json").then((m) => m.default),
    products: () => import("./dictionaries/en/products.json").then((m) => m.default),
    product: () => import("./dictionaries/en/product.json").then((m) => m.default),
    about: () => import("./dictionaries/en/about.json").then((m) => m.default),
    contact: () => import("./dictionaries/en/contact.json").then((m) => m.default),
    legal: () => import("./dictionaries/en/legal.json").then((m) => m.default),
    cart: () => import("./dictionaries/en/cart.json").then((m) => m.default),
    auth: () => import("./dictionaries/en/auth.json").then((m) => m.default),
    checkout: () => import("./dictionaries/en/checkout.json").then((m) => m.default),
  },
};

export async function getDictionary<N extends Namespace>(
  locale: Locale,
  namespace: N,
): Promise<DictionaryMap[N]> {
  return namespaces[locale][namespace]();
}
