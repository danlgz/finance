'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  budgetedAmount: number;
  expenses?: {
    amount: number;
  }[];
  items?: {
    id: string;
    name: string;
    amount: number;
    expenses?: {
      id: string;
      amount: number;
      description: string;
      date: string;
    }[];
  }[];
}

interface BudgetSummaryTableProps {
  categories: Category[];
  currency?: string;
  t: (key: string) => string;
}

export function BudgetSummaryTable({ categories, currency = 'USD', t }: BudgetSummaryTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const calculateTotalExpenses = (category: Category) => {
    if (category.expenses) {
      return category.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }
    
    if (category.items) {
      return category.items.reduce((sum, item) => {
        const itemExpenses = item.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0;
        return sum + itemExpenses;
      }, 0);
    }
    
    return 0;
  };

  const calculateTotalBudgeted = () => {
    return categories.reduce((total, category) => {
      if (category.budgetedAmount) {
        return total + category.budgetedAmount;
      }
      
      if (category.items) {
        return total + category.items.reduce((sum, item) => sum + item.amount, 0);
      }
      
      return total;
    }, 0);
  };

  const calculateTotalSpent = () => {
    return categories.reduce((total, category) => {
      const categoryExpenses = calculateTotalExpenses(category);
      return total + categoryExpenses;
    }, 0);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
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
              {categories.map((category) => {
                const totalExpenses = calculateTotalExpenses(category);
                const budgetedAmount = category.budgetedAmount || 
                  (category.items?.reduce((sum, item) => sum + item.amount, 0) || 0);
                const remaining = budgetedAmount - totalExpenses;
                const categoryId = `category-${category.id}`;
                const isExpanded = expandedCategories.includes(categoryId);
                
                return (
                  <React.Fragment key={category.id}>
                    <tr 
                      className="border-b hover:bg-secondary/10 transition-colors cursor-pointer"
                      onClick={() => toggleCategory(categoryId)}
                    >
                      <td className="w-8">
                        {category.items && category.items.length > 0 && (
                          <div className="flex w-8 justify-center p-2">
                            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        )}
                      </td>
                      <td className="py-2 font-medium">{category.name}</td>
                      <td className="text-right py-2 w-32 font-medium">
                        {formatCurrency(budgetedAmount, currency)}
                      </td>
                      <td className="text-right py-2 w-32 font-medium">
                        {formatCurrency(totalExpenses, currency)}
                      </td>
                      <td className={`text-right py-2 w-32 font-medium ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {formatCurrency(remaining, currency)}
                      </td>
                    </tr>
                    
                    {isExpanded && category.items && category.items.length > 0 && (
                      <tr className="border-b-0">
                        <td colSpan={5} className="p-0">
                          <div className="py-4 pl-8">
                            <table className="w-full">
                              <tbody>
                                {category.items.map((item) => {
                                  const itemExpenses = item.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
                                  const itemRemaining = item.amount - itemExpenses;
                                  
                                  return (
                                    <tr key={item.id} className="border-b hover:bg-secondary/10">
                                      <td className="py-2 pl-4 text-sm">{item.name}</td>
                                      <td className="text-right py-2 w-32 text-sm">
                                        {formatCurrency(item.amount, currency)}
                                      </td>
                                      <td className="text-right py-2 w-32 text-sm">
                                        {formatCurrency(itemExpenses, currency)}
                                      </td>
                                      <td className={`text-right py-2 w-32 text-sm ${itemRemaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                                        {formatCurrency(itemRemaining, currency)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
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
                  {formatCurrency(calculateTotalBudgeted(), currency)}
                </td>
                <td className="text-right py-4 w-32 font-bold">
                  {formatCurrency(calculateTotalSpent(), currency)}
                </td>
                <td className={`text-right py-4 w-32 font-bold ${(calculateTotalBudgeted() - calculateTotalSpent()) < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {formatCurrency(calculateTotalBudgeted() - calculateTotalSpent(), currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
} 