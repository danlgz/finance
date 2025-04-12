"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, CalendarIcon } from "lucide-react";
import { useTranslate } from "@/hooks/useTranslate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Budget {
  id: string;
  name: string;
  month: number;
  year: number;
  householdId: string;
  currency: string;
  household: {
    id: string;
    name: string;
  };
  categories: Category[];
}

interface Category {
  id: string;
  name: string;
  items: ExpenseItem[];
}

interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export default function CreateExpensePage() {
  const { t } = useTranslate();
  const router = useRouter();
  const searchParams = useSearchParams();
  const budgetId = searchParams.get("budgetId");
  
  // Crear una función para obtener traducciones con prefijos comunes
  const translate = (key: string, prefix?: string) => {
    if (prefix) {
      return t(`${prefix}:${key}`);
    }
    return t(key);
  };
  
  const formSchema = z.object({
    description: z.string().min(1, {
      message: translate('descriptionRequired', 'expenses')
    }),
    amount: z.coerce.number().positive({
      message: translate('amountPositive', 'expenses')
    }),
    date: z.date(),
    budgetId: z.string().min(1, {
      message: translate('budgetRequired', 'expenses')
    }),
    categoryId: z.string().min(1, {
      message: translate('categoryRequired', 'expenses')
    }),
    expenseItemId: z.string().min(1, {
      message: translate('itemRequired', 'expenses')
    }),
    householdId: z.string().min(1, {
      message: translate('householdRequired', 'expenses')
    }),
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBudgets, setIsFetchingBudgets] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [hasFetchedBudgets, setHasFetchedBudgets] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      date: new Date(),
      budgetId: budgetId || "",
      categoryId: "",
      expenseItemId: "",
      householdId: "",
    },
  });

  // Si se proporciona un budgetId en la URL, establecerlo en el form
  useEffect(() => {
    if (budgetId) {
      form.setValue("budgetId", budgetId);
    }
  }, [budgetId, form]);

  // Cargar la lista de presupuestos
  useEffect(() => {
    const fetchBudgets = async () => {
      if (hasFetchedBudgets) return;
      
      try {
        setIsFetchingBudgets(true);
        const response = await fetch('/api/budgets');
        
        if (!response.ok) {
          throw new Error("Failed to fetch budgets");
        }
        
        const data = await response.json();
        setBudgets(data);
        setHasFetchedBudgets(true);
        
        // Si se proporciona un budgetId en la URL, cargar ese presupuesto
        if (budgetId) {
          const budget = data.find((b: Budget) => b.id === budgetId);
          if (budget) {
            setSelectedBudget(budget);
            form.setValue("householdId", budget.householdId);
            setCategories(budget.categories || []);
          }
        }
      } catch (error) {
        console.error("Error fetching budgets:", error);
        toast.error(t('common:errorFetchingData'));
      } finally {
        setIsFetchingBudgets(false);
      }
    };

    fetchBudgets();
  }, [budgetId, form, t, hasFetchedBudgets]);

  // Cargar los detalles de un presupuesto cuando se selecciona
  const loadBudgetDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/budgets/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch budget details");
      }
      
      const data = await response.json();
      setSelectedBudget(data);
      form.setValue("householdId", data.householdId);
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching budget details:", error);
      toast.error(t('common:errorFetchingData'));
    } finally {
      setIsLoading(false);
    }
  };

  // Cuando cambia el budgetId en el formulario
  const onBudgetChange = (value: string) => {
    form.setValue("budgetId", value);
    form.setValue("categoryId", "");
    form.setValue("expenseItemId", "");
    setItems([]);
    
    if (value) {
      loadBudgetDetails(value);
    } else {
      setSelectedBudget(null);
      setCategories([]);
    }
  };

  // Cuando cambia la categoría en el formulario
  const onCategoryChange = (value: string) => {
    form.setValue("categoryId", value);
    form.setValue("expenseItemId", "");
    
    if (value && selectedBudget) {
      const category = selectedBudget.categories.find(c => c.id === value);
      setItems(category?.items || []);
    } else {
      setItems([]);
    }
  };

  // Manejar el envío del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create expense");
      }
      
      toast.success(t('expenses:expenseCreated'));
      
      // Redirigir de vuelta a la página anterior
      router.back();
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error(t('common:errorSavingData'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {translate('back', 'common')}
        </Button>
        <h1 className="text-3xl font-bold">{translate('addExpense', 'expenses')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate('expenseDetails', 'expenses')}</CardTitle>
          <CardDescription>{translate('fillExpenseInfo', 'expenses')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="budgetId"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{translate('budget', 'common')}</FormLabel>
                      <Select
                        disabled={isFetchingBudgets}
                        onValueChange={(value) => onBudgetChange(value)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={translate('selectBudget', 'expenses')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {budgets.map((budget) => (
                            <SelectItem key={budget.id} value={budget.id}>
                              {budget.household.name} - {translate(`month_${budget.month}`, 'budgets')} {budget.year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{translate('category', 'budgets')}</FormLabel>
                      <Select
                        disabled={!selectedBudget || isLoading}
                        onValueChange={(value) => onCategoryChange(value)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={translate('selectCategory', 'expenses')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseItemId"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{translate('item', 'budgets')}</FormLabel>
                      <Select
                        disabled={items.length === 0 || isLoading}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={translate('selectItem', 'expenses')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({selectedBudget?.currency} {item.amount})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{translate('description', 'common')}</FormLabel>
                      <FormControl>
                        <Input placeholder={translate('descriptionPlaceholder', 'expenses')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{translate('amount', 'common')}</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="mr-2">{selectedBudget?.currency || 'GTQ'}</span>
                          <Input type="number" step="0.01" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{translate('date', 'common')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{translate('pickDate', 'expenses')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date: Date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translate('loading', 'common')}
                  </>
                ) : translate('saveExpense', 'expenses')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 