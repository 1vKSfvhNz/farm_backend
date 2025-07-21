import React from "react";
  
// État de tri et de filtre
export type SortOption = {
    label: string;
    value: string;
    order: 'asc' | 'desc';
};

// Type pour les informations de pagination
export type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
};
  
// Dans types.ts
export interface SettingItemProps {
    icon: string;
    iconType?: 'ionicon' | 'material';
    title: string;
    description?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void | Promise<void>;
    type: 'switch' | 'navigation';
    onPress?: () => void;
    tintColor?: string;
}

export type SettingsSectionProps = {
    title: string;
    children: React.ReactNode;
}
