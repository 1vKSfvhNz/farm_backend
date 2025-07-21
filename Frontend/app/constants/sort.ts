import { SortOption } from "../types/types";

export const sortOptions: SortOption[] = [
  { label: 'Nom (A-Z)', value: 'name', order: 'asc' },
  { label: 'Nom (Z-A)', value: 'name', order: 'desc' },
  { label: 'Prix (croissant)', value: 'price', order: 'asc' },
  { label: 'Prix (décroissant)', value: 'price', order: 'desc' },
  { label: 'Stock (croissant)', value: 'stock', order: 'asc' },
  { label: 'Stock (décroissant)', value: 'stock', order: 'desc' },
  { label: 'Les plus récents', value: 'isNew', order: 'desc' },
];
