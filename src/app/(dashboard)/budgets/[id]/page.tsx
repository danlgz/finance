"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslate } from "@/hooks/useTranslate";
import React from "react";
import { BudgetSummaryTable } from "@/components/budgets/BudgetSummaryTable";
import { ExpensesTable } from "@/components/expenses/ExpensesTable";

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

interface CategoryApiResponse {
  id: string;
  name: string;
  items: {
    id: string;
    name: string;
    amount: number;
    expenses: Expense[];
  }[];
}

export default function BudgetDetailsPage() {
  const { t } = useTranslate();
  const params = useParams();
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const transformedCategories = data.categories.map((category: CategoryApiResponse) => {
          const budgetedAmount = category.items.reduce((sum: number, item) => sum + item.amount, 0);
          const expenses = category.items.flatMap(item => 
            item.expenses.map(expense => ({
              ...expense,
              categoryId: category.id
            }))
          );
          
          return {
            id: category.id,
            name: category.name,
            budgetedAmount,
            expenses,
            items: category.items
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

  const formatBudgetCurrency = (amount: number) => {
    return formatCurrency(amount, budget?.currency || 'USD');
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

  const allExpenses = budget.categories.flatMap(category => category.expenses);

  return (
    <div className="space-y-6 relative">
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

      <div className="fixed bottom-4 right-4">
        <Button 
          onClick={() => router.push(`/expenses/create?budgetId=${budget.id}`)}
          className="shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('expenses:addExpense')}
        </Button>
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

      <BudgetSummaryTable 
        categories={budget.categories}
        currency={budget.currency}
        t={t}
      />

      <ExpensesTable 
        expenses={allExpenses}
        categories={budget.categories}
        currency={budget.currency}
        t={t}
      />
    </div>
  );
} 