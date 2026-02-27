export interface Ingredient {
    name: string;
    amount_g: number;
}

export interface Meal {
    name: string;
    timeLabel: string;
    calories: number;
    p: number;
    f: number;
    c: number;
    description: string;
    ingredients?: Ingredient[];
    steps?: string[];
}

export interface Nutrition {
    calories: number;
    p: number;
    f: number;
    c: number;
}

export interface DayMenu {
    dayLabel: string;
    meals: Meal[];
    total: Nutrition;
}

export interface ShoppingListItem {
    name: string;
    amount_g: number;
    category?: string;
}

export interface MenuData {
    days: DayMenu[];
    shoppingList?: ShoppingListItem[];
    grandTotal: Nutrition;
}

export interface FixedMeal {
    recipeId: string;
    mealIndex: number; // 0: 1食目, 1: 2食目 ...
}

export interface GenerateMenuRequest {
    calories: number;
    p: number;
    f: number;
    c: number;
    mainIngredient?: string;
    allergies: string;
    dislikedFoods: string;
    avoidFoods: string;
    mealCount: number;
    days: number;
    fixedMeals?: FixedMeal[];
}
