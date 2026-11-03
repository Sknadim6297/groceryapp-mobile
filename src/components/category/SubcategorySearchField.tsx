import { CatalogSearchField } from '@/components/catalog/CatalogSearchField';

type SubcategorySearchFieldProps = {
  value: string;
  onChange: (next: string) => void;
};

/** @deprecated Prefer CatalogSearchField — kept for existing subcategory imports. */
export function SubcategorySearchField({ value, onChange }: SubcategorySearchFieldProps) {
  return (
    <CatalogSearchField
      value={value}
      onChange={onChange}
      placeholder="Search subcategories"
      accessibilityLabel="Search subcategories"
      testID="subcategory-search"
    />
  );
}
