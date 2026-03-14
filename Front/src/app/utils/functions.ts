import { ItemRead } from '../models/items.model';

export function getNumArticlesFromItems(items: ItemRead[]): number {
  return Math.round(
    items.reduce((total, item) => total + item.count, 0) / 3,
  );
}
