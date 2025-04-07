import { Button } from "@/components/ui/button";

export type ServiceCategoryType = 'followers' | 'views' | 'likes' | 'comments';

interface ServiceCategoryProps {
  categories: { id: ServiceCategoryType; label: string }[];
  selectedCategory: ServiceCategoryType;
  onSelectCategory: (category: ServiceCategoryType) => void;
}

export function ServiceCategory({ categories, selectedCategory, onSelectCategory }: ServiceCategoryProps) {
  return (
    <div className="flex overflow-x-auto pb-4">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          className="ml-2 first:ml-0 whitespace-nowrap"
          onClick={() => onSelectCategory(category.id)}
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
}

// Default categories
export const defaultCategories = [
  { id: 'followers' as ServiceCategoryType, label: 'Followers' },
  { id: 'views' as ServiceCategoryType, label: 'Views' },
  { id: 'likes' as ServiceCategoryType, label: 'Likes' },
  { id: 'comments' as ServiceCategoryType, label: 'Comments' }
];
