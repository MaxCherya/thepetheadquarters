import "server-only";

import type { Locale } from "./config";

import enCommon from "./dictionaries/en/common.json";
import enHome from "./dictionaries/en/home.json";

type DictionaryMap = {
  common: typeof enCommon;
  home: typeof enHome;
};

export type Namespace = keyof DictionaryMap;

const namespaces: Record<Locale, { [K in Namespace]: () => Promise<DictionaryMap[K]> }> = {
  en: {
    common: () => import("./dictionaries/en/common.json").then((m) => m.default),
    home: () => import("./dictionaries/en/home.json").then((m) => m.default),
  },
};

export async function getDictionary<N extends Namespace>(
  locale: Locale,
  namespace: N,
): Promise<DictionaryMap[N]> {
  return namespaces[locale][namespace]();
}
