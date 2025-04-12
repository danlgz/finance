"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslate } from "@/hooks/useTranslate";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import React from "react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  itemId?: string;
}

interface Category {
  id: string;
  name: string;
  budgetedAmount: number;
  expenses: Expense[];
  items?: {
    id: string;
    name: string;
    amount: number;
    expenses?: Expense[];
  }[];
}

interface Budget {
  id: string;
  month: number;
  year: number;
  currency: string;
  household: {
    id: string;
    name: string;
  };
  categories: Category[];
  incomeAmount: number;
}

export default function BudgetDetailsPage() {
  const { t } = useTranslate();
  const params = useParams();
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/budgets/${params.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch budget");
        }
        
        const data = await response.json();
        
        // Transform the API response to match our component's expected structure
        const transformedCategories = data.categories.map((category: any) => {
          // Calculate the total budgeted amount from all items
          const budgetedAmount = category.items.reduce((sum: number, item: any) => sum + item.amount, 0);
          
          // Flatten all expenses from items
          const expenses = category.items.flatMap((item: any) => 
            item.expenses.map((expense: any) => ({
              ...expense,
              categoryId: category.id
            }))
          );
          
          return {
            id: category.id,
            name: category.name,
            budgetedAmount,
            expenses,
            items: category.items // Guardar también los items originales
          };
        });
        
        setBudget({
          id: data.id,
          month: data.month,
          year: data.year,
          currency: data.currency || 'USD',
          household: data.household,
          categories: transformedCategories,
          incomeAmount: data.incomeAmount || 0
        });
      } catch (err) {
        console.error("Error fetching budget:", err);
        setError("Failed to load budget details");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBudget();
    }
  }, [params.id]);

  const handleBackClick = () => {
    router.back();
  };

  const calculateTotalBudgeted = () => {
    if (!budget?.categories) return 0;
    return budget.categories.reduce((total, category) => total + category.budgetedAmount, 0);
  };

  const calculateTotalExpenses = () => {
    if (!budget?.categories) return 0;
    return budget.categories.reduce((total, category) => {
      const categoryExpenses = category.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      return total + categoryExpenses;
    }, 0);
  };

  const calculateRemaining = () => {
    return budget?.incomeAmount ? budget.incomeAmount - calculateTotalBudgeted() : 0;
  };

  // Helper function to format currency using the budget's currency
  const formatBudgetCurrency = (amount: number) => {
    return formatCurrency(amount, budget?.currency || 'USD');
  };

  // Helper function to format dates consistently
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common:back')}
        </Button>
        <Card>
          <CardContent className="flex items-center justify-center h-60">
            <p className="text-muted-foreground">{error || t('common:error')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common:back')}
        </Button>
        <h1 className="text-3xl font-bold">{budget.household.name} {t('common:budgets')} - {t(`budgets:month_${budget.month}`)} {budget.year}</h1>
        <div className="ml-auto">
          <Button 
            variant="outline"
            onClick={() => router.push(`/budgets/${budget.id}/edit`)}
          >
            {t('budgets:editBudget')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('budgets:totalBudget')}</CardTitle>
            <CardDescription>
              {budget.month}/{budget.year} {t('common:for')} {budget.household.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('budgets:totalBudget')}:</span>
              <span className="font-bold">{formatBudgetCurrency(budget.incomeAmount)}</span>
            </div>

            {budget.categories && budget.categories.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold">{t('budgets:categories')}</h3>
                <div className="space-y-2">
                  {budget.categories.map((category) => (
                    <div key={category.id} className="flex justify-between items-center p-2 bg-secondary/20 rounded-md">
                      <span>{category.name}</span>
                      <span>{formatBudgetCurrency(category.budgetedAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">{t('budgets:noCategoriesDefined')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('budgets:incomeSummary')}</CardTitle>
            <CardDescription>
              {t('budgets:forPeriod', { month: budget.month, year: budget.year })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budget.incomeAmount > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('budgets:totalIncome')}:</span>
                  <span className="font-bold">
                    {formatBudgetCurrency(budget.incomeAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">{t('budgets:noIncomeRegistered')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('budgets:totalBudgeted')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBudgetCurrency(calculateTotalBudgeted())}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('budgets:totalSpent')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBudgetCurrency(calculateTotalExpenses())}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('budgets:remainingToBudget')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${calculateRemaining() < 0 ? 'text-destructive' : 'text-primary'}`}>
              {formatBudgetCurrency(calculateRemaining())}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('budgets:budgetSummary')}</CardTitle>
          <CardDescription>{t('budgets:overview')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="w-8"></th>
                  <th className="text-left py-2 font-bold">{t('budgets:category')}</th>
                  <th className="w-32 text-right py-2 font-bold">{t('budgets:budgeted')}</th>
                  <th className="w-32 text-right py-2 font-bold">{t('budgets:spent')}</th>
                  <th className="w-32 text-right py-2 font-bold">{t('budgets:remaining')}</th>
                </tr>
              </thead>
              <tbody>
                {budget.categories.map((category) => {
                  const totalExpenses = category.expenses.reduce((sum, expense) => sum + expense.amount, 0);
                  const remaining = category.budgetedAmount - totalExpenses;
                  const categoryId = `category-${category.id}`;
                  
                  return (
                    <React.Fragment key={categoryId}>
                      <tr 
                        className="border-b hover:bg-secondary/10 transition-colors cursor-pointer"
                        onClick={() => toggleCategory(categoryId)}
                      >
                        <td className="w-8">
                          <div className="flex w-8 justify-center p-2">
                            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${expandedCategories.includes(categoryId) ? 'rotate-90' : ''}`} />
                          </div>
                        </td>
                        <td className="py-2 font-medium">{category.name}</td>
                        <td className="text-right py-2 w-32 font-medium">
                          {formatBudgetCurrency(category.budgetedAmount)}
                        </td>
                        <td className="text-right py-2 w-32 font-medium">
                          {formatBudgetCurrency(totalExpenses)}
                        </td>
                        <td className={`text-right py-2 w-32 font-medium ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                          {formatBudgetCurrency(remaining)}
                        </td>
                      </tr>
                      
                      {expandedCategories.includes(categoryId) && (
                        <tr className="border-b-0">
                          <td colSpan={5} className="p-0">
                            <div className="py-4 pl-8">
                              <table className="w-full">
                                <tbody>
                                  {category.items?.map((item) => {
                                    // Calcular los gastos para este ítem específico
                                    const itemExpenses = category.expenses.filter(
                                      (expense) => expense.categoryId === category.id && 
                                      expense.itemId === item.id
                                    );
                                    const itemSpent = itemExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                                    const itemRemaining = item.amount - itemSpent;
                                    
                                    return (
                                      <tr key={item.id} className="border-b hover:bg-secondary/10">
                                        <td className="py-2 pl-4 text-sm">{item.name}</td>
                                        <td className="text-right py-2 w-32 text-sm">
                                          {formatBudgetCurrency(item.amount)}
                                        </td>
                                        <td className="text-right py-2 w-32 text-sm">
                                          {formatBudgetCurrency(itemSpent)}
                                        </td>
                                        <td className={`text-right py-2 w-32 text-sm ${itemRemaining < 0 ? 'text-destructive font-semibold' : itemRemaining === 0 ? 'text-muted-foreground' : 'text-primary'}`}>
                                          {formatBudgetCurrency(itemRemaining)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              
                              {category.expenses.length > 0 && (
                                <div className="mt-6">
                                  <h4 className="text-md font-medium mb-2">{t('budgets:expenses')}</h4>
                                  <table className="w-full">
                                    <thead>
                                      <tr className="border-b text-sm">
                                        <th className="text-left py-2">{t('common:date')}</th>
                                        <th className="text-left py-2">{t('common:description')}</th>
                                        <th className="w-32 text-right py-2">{t('common:amount')}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {category.expenses.map((expense) => (
                                        <tr key={expense.id} className="border-b hover:bg-secondary/10">
                                          <td className="py-2">{formatDate(expense.date)}</td>
                                          <td className="py-2">{expense.description}</td>
                                          <td className="text-right py-2 w-32">
                                            {formatBudgetCurrency(expense.amount)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                
                <tr className="border-t">
                  <td className="w-8"></td>
                  <td className="py-4 font-bold">{t('budgets:total')}</td>
                  <td className="text-right py-4 w-32 font-bold">
                    {formatBudgetCurrency(calculateTotalBudgeted())}
                  </td>
                  <td className="text-right py-4 w-32 font-bold">
                    {formatBudgetCurrency(calculateTotalExpenses())}
                  </td>
                  <td className={`text-right py-4 w-32 font-bold ${(calculateTotalBudgeted() - calculateTotalExpenses()) < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {formatBudgetCurrency(calculateTotalBudgeted() - calculateTotalExpenses())}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 