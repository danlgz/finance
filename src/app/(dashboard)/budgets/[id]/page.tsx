"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  budgetedAmount: number;
  expenses: Expense[];
}

interface Budget {
  id: string;
  month: number;
  year: number;
  household: {
    id: string;
    name: string;
  };
  categories: Category[];
  incomeAmount: number;
}

export default function BudgetDetailsPage() {
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
        setBudget(data);
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
          Back
        </Button>
        <Card>
          <CardContent className="flex items-center justify-center h-60">
            <p className="text-muted-foreground">{error || "Budget not found"}</p>
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
          Back
        </Button>
        <h1 className="text-3xl font-bold">{budget.household.name} Budget - {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long' })} {budget.year}</h1>
        <div className="ml-auto">
          <Button 
            variant="outline"
            onClick={() => router.push(`/budgets/${budget.id}/edit`)}
          >
            Edit Budget
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Details</CardTitle>
            <CardDescription>
              {budget.month}/{budget.year} for {budget.household.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Budget:</span>
              <span className="font-bold">{formatCurrency(budget.incomeAmount)}</span>
            </div>

            {budget.categories && budget.categories.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold">Categories</h3>
                <div className="space-y-2">
                  {budget.categories.map((category) => (
                    <div key={category.id} className="flex justify-between items-center p-2 bg-secondary/20 rounded-md">
                      <span>{category.name}</span>
                      <span>{formatCurrency(category.budgetedAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No categories defined</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Summary</CardTitle>
            <CardDescription>
              For the same period ({budget.month}/{budget.year})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budget.incomeAmount > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Income:</span>
                  <span className="font-bold">
                    {formatCurrency(budget.incomeAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No income registered for this period</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Budgeted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(calculateTotalBudgeted())}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(calculateTotalExpenses())}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remaining to Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${calculateRemaining() < 0 ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(calculateRemaining())}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
          <CardDescription>Overview of your budget categories and expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Budgeted</th>
                  <th className="text-right py-2">Spent</th>
                  <th className="text-right py-2">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {budget.categories.map((category) => {
                  const totalExpenses = category.expenses.reduce((sum, expense) => sum + expense.amount, 0);
                  const remaining = category.budgetedAmount - totalExpenses;
                  
                  return (
                    <tr key={category.id} className="border-b hover:bg-secondary/20">
                      <td className="py-2">{category.name}</td>
                      <td className="text-right py-2">{formatCurrency(category.budgetedAmount)}</td>
                      <td className="text-right py-2">{formatCurrency(totalExpenses)}</td>
                      <td className={`text-right py-2 ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {formatCurrency(remaining)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td className="py-2">Total</td>
                  <td className="text-right py-2">{formatCurrency(calculateTotalBudgeted())}</td>
                  <td className="text-right py-2">{formatCurrency(calculateTotalExpenses())}</td>
                  <td className="text-right py-2">{formatCurrency(calculateTotalBudgeted() - calculateTotalExpenses())}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Category Details</h2>
        {budget.categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
              <CardDescription>
                {formatCurrency(category.budgetedAmount)} budgeted | 
                {formatCurrency(category.expenses.reduce((sum, expense) => sum + expense.amount, 0))} spent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {category.expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.expenses.map((expense) => (
                        <tr key={expense.id} className="border-b hover:bg-secondary/20">
                          <td className="py-2">{new Date(expense.date).toLocaleDateString()}</td>
                          <td className="py-2">{expense.description}</td>
                          <td className="text-right py-2">{formatCurrency(expense.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No expenses recorded for this category.</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={() => router.push(`/expenses/new?categoryId=${category.id}`)}>
                Add Expense
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 