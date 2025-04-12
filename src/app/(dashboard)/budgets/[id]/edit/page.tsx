'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { PlusCircle, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslate } from '@/hooks/useTranslate';
import { formatCurrency } from '@/lib/utils';

interface Household {
  id: string;
  name: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
}

interface ExpenseItem {
  id?: string;
  name: string;
  amount: number;
  categoryId: string;
  tempId?: string; // Used for new items that don't have an ID yet
}

interface BudgetCategory {
  id?: string;
  name: string;
  tempId?: string; // Used for new categories that don't have an ID yet
  items: ExpenseItem[];
}

interface Budget {
  id: string;
  name: string;
  month: number;
  year: number;
  currency: string;
  householdId: string;
  categories: BudgetCategory[];
}

export default function EditBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslate();
  const resolvedParams = use(params);
  const budgetId = resolvedParams.id;
  
  const [households, setHouseholds] = useState<Household[]>([]);
  const [formData, setFormData] = useState<Budget>({
    id: budgetId,
    name: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    currency: 'GTQ',
    householdId: '',
    categories: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch budget data
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const response = await fetch(`/api/budgets/${budgetId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Budget not found');
          } else if (response.status === 403) {
            throw new Error('You do not have access to this budget');
          } else {
            throw new Error('Failed to fetch budget');
          }
        }
        
        const budgetData = await response.json();
        
        // Transform the data to match the form structure
        const transformedCategories = budgetData.categories.map((category: any) => ({
          id: category.id,
          name: category.name,
          items: category.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            amount: item.amount,
            categoryId: category.id
          }))
        }));

        setFormData({
          id: budgetData.id,
          name: budgetData.name,
          month: budgetData.month,
          year: budgetData.year,
          currency: budgetData.currency,
          householdId: budgetData.household.id,
          categories: transformedCategories
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching budget:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
        setIsLoading(false);
      }
    };

    const fetchHouseholds = async () => {
      try {
        const response = await fetch('/api/households');
        if (!response.ok) {
          throw new Error('Failed to fetch households');
        }
        const data = await response.json();
        setHouseholds(data);
      } catch (error) {
        console.error('Error fetching households:', error);
        setError('Failed to load households. Please try again.');
      }
    };

    Promise.all([fetchBudget(), fetchHouseholds()]);
  }, [budgetId]);

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add a new category
  const addCategory = () => {
    const newCategory: BudgetCategory = {
      name: '',
      tempId: `temp-category-${Date.now()}`,
      items: []
    };
    
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  // Update category name
  const updateCategoryName = (categoryId: string | undefined, tempId: string | undefined, name: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if ((categoryId && category.id === categoryId) || (tempId && category.tempId === tempId)) {
          return { ...category, name };
        }
        return category;
      })
    }));
  };

  // Delete a category
  const deleteCategory = (categoryId: string | undefined, tempId: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(category => 
        (categoryId ? category.id !== categoryId : true) && 
        (tempId ? category.tempId !== tempId : true)
      )
    }));
  };

  // Add item to a category
  const addItem = (categoryId: string | undefined, tempId: string | undefined) => {
    const newItem: ExpenseItem = {
      name: '',
      amount: 0,
      categoryId: categoryId || '',
      tempId: `temp-item-${Date.now()}`
    };
    
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if ((categoryId && category.id === categoryId) || (tempId && category.tempId === tempId)) {
          return {
            ...category,
            items: [...category.items, newItem]
          };
        }
        return category;
      })
    }));
  };

  // Update item
  const updateItem = (
    categoryId: string | undefined, 
    categoryTempId: string | undefined, 
    itemId: string | undefined, 
    itemTempId: string | undefined, 
    data: Partial<ExpenseItem>
  ) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if ((categoryId && category.id === categoryId) || (categoryTempId && category.tempId === categoryTempId)) {
          return {
            ...category,
            items: category.items.map(item => {
              if ((itemId && item.id === itemId) || (itemTempId && item.tempId === itemTempId)) {
                return { ...item, ...data };
              }
              return item;
            })
          };
        }
        return category;
      })
    }));
  };

  // Delete item
  const deleteItem = (
    categoryId: string | undefined, 
    categoryTempId: string | undefined, 
    itemId: string | undefined, 
    itemTempId: string | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if ((categoryId && category.id === categoryId) || (categoryTempId && category.tempId === categoryTempId)) {
          return {
            ...category,
            items: category.items.filter(item => 
              (itemId ? item.id !== itemId : true) && 
              (itemTempId ? item.tempId !== itemTempId : true)
            )
          };
        }
        return category;
      })
    }));
  };

  // Generate months for select
  const months = [
    { value: '1', label: t('budgets:month_1') },
    { value: '2', label: t('budgets:month_2') },
    { value: '3', label: t('budgets:month_3') },
    { value: '4', label: t('budgets:month_4') },
    { value: '5', label: t('budgets:month_5') },
    { value: '6', label: t('budgets:month_6') },
    { value: '7', label: t('budgets:month_7') },
    { value: '8', label: t('budgets:month_8') },
    { value: '9', label: t('budgets:month_9') },
    { value: '10', label: t('budgets:month_10') },
    { value: '11', label: t('budgets:month_11') },
    { value: '12', label: t('budgets:month_12') },
  ];

  // Generate years for select (current year - 1 to current year + 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Validate the form
      if (!formData.name.trim()) {
        throw new Error(t('budgets:errors.nameRequired'));
      }
      
      if (!formData.householdId) {
        throw new Error(t('budgets:errors.selectHousehold'));
      }
      
      // Check if there are categories and each has a name
      if (formData.categories.length === 0) {
        throw new Error(t('budgets:errors.addCategory'));
      }
      
      for (const category of formData.categories) {
        if (!category.name.trim()) {
          throw new Error(t('budgets:errors.categoryNameRequired'));
        }
        
        // Each category should have at least one item
        if (category.items.length === 0) {
          throw new Error(t('budgets:errors.categoryNeedsItems', { category: category.name }));
        }
        
        // Each item should have a name and a valid amount
        for (const item of category.items) {
          if (!item.name.trim()) {
            throw new Error(t('budgets:errors.itemNameRequired', { category: category.name }));
          }
          
          if (isNaN(item.amount) || item.amount <= 0) {
            throw new Error(t('budgets:errors.itemAmountInvalid', { item: item.name, category: category.name }));
          }
        }
      }
      
      // Submit the form
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t('budgets:errors.updateFailed'));
      }
      
      toast.success(t('budgets:updateSuccess'));
      router.push(`/budgets/${budgetId}`);
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error(error instanceof Error ? error.message : t('budgets:errors.genericError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-xl">{t('common:loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{t('common:error')}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Button variant="secondary" onClick={() => router.push('/budgets')}>
                {t('common:back')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('budgets:editBudget')}</h1>
        <Button variant="outline" onClick={() => router.push(`/budgets/${budgetId}`)}>
          {t('common:cancel')}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('budgets:budgetInformation')}</CardTitle>
            <CardDescription>{t('budgets:basicInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('budgets:budgetName')}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t('budgets:budgetNamePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="household">{t('common:household')}</Label>
                <Select 
                  value={formData.householdId} 
                  onValueChange={(value) => handleSelectChange('householdId', value)}
                >
                  <SelectTrigger id="household">
                    <SelectValue placeholder={t('budgets:selectHousehold')} />
                  </SelectTrigger>
                  <SelectContent>
                    {households.map((household) => (
                      <SelectItem key={household.id} value={household.id}>
                        {household.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">{t('common:month')}</Label>
                <Select 
                  value={formData.month.toString()} 
                  onValueChange={(value) => handleSelectChange('month', value)}
                >
                  <SelectTrigger id="month">
                    <SelectValue placeholder={t('budgets:selectMonth')} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">{t('common:year')}</Label>
                <Select 
                  value={formData.year.toString()} 
                  onValueChange={(value) => handleSelectChange('year', value)}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder={t('budgets:selectYear')} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">{t('common:currency')}</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleSelectChange('currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder={t('budgets:selectCurrency')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GTQ">{t('currencies:gtq')}</SelectItem>
                    <SelectItem value="USD">{t('currencies:usd')}</SelectItem>
                    <SelectItem value="EUR">{t('currencies:eur')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>{t('budgets:categories')}</CardTitle>
              <CardDescription>{t('budgets:categoriesDesc')}</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCategory}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('budgets:addCategory')}
            </Button>
          </CardHeader>
          <CardContent>
            {formData.categories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                <p className="text-gray-500">{t('budgets:noCategoriesYet')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.categories.map((category, categoryIndex) => (
                  <Card key={category.id || category.tempId}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="w-full mr-4">
                        <Input
                          placeholder={t('budgets:categoryName')}
                          value={category.name}
                          onChange={(e) => updateCategoryName(category.id, category.tempId, e.target.value)}
                          className="font-semibold"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteCategory(category.id, category.tempId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {category.items.map((item, itemIndex) => (
                          <div key={item.id || item.tempId} className="flex items-center space-x-4">
                            <div className="flex-1">
                              <Input
                                placeholder={t('budgets:itemName')}
                                value={item.name}
                                onChange={(e) => updateItem(
                                  category.id, 
                                  category.tempId, 
                                  item.id, 
                                  item.tempId, 
                                  { name: e.target.value }
                                )}
                              />
                            </div>
                            <div className="w-32">
                              <Input
                                type="number"
                                placeholder={t('common:amount')}
                                value={item.amount}
                                onChange={(e) => updateItem(
                                  category.id,
                                  category.tempId,
                                  item.id,
                                  item.tempId,
                                  { amount: parseFloat(e.target.value) || 0 }
                                )}
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteItem(category.id, category.tempId, item.id, item.tempId)}
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addItem(category.id, category.tempId)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          {t('budgets:addItem')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push(`/budgets/${budgetId}`)}>
              {t('common:cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('common:saving') : t('common:save')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 