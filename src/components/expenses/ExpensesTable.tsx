'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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
  expenses: Expense[];
}

interface ExpensesTableProps {
  expenses: Expense[];
  categories: Category[];
  currency?: string;
  t: (key: string) => string;
}

export function ExpensesTable({ expenses, categories, currency = 'USD', t }: ExpensesTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || '';
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('budgets:expenses')}</CardTitle>
        <CardDescription>{t('budgets:expensesOverview')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">{t('common:date')}</th>
                <th className="text-left py-2 font-medium text-muted-foreground">{t('common:description')}</th>
                <th className="text-left py-2 font-medium text-muted-foreground">{t('budgets:category')}</th>
                <th className="w-32 text-right py-2 font-medium text-muted-foreground">{t('common:amount')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id} className="border-b hover:bg-secondary/10">
                  <td className="py-2 text-sm">{formatDate(expense.date)}</td>
                  <td className="py-2 text-sm">{expense.description}</td>
                  <td className="py-2 text-sm">{getCategoryName(expense.categoryId)}</td>
                  <td className="text-right py-2 w-32 text-sm font-medium">
                    {formatCurrency(expense.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
} 