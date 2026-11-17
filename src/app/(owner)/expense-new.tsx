import { useState } from 'react';
import { router } from 'expo-router';

import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import { useCreateExpense } from '@/features/expenses/hooks/use-expenses';
import {
  EXPENSE_CATEGORIES,
  expenseSchema,
  type ExpenseCategory,
} from '@/features/expenses/schemas/expense-schema';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

export default function ExpenseNewScreen() {
  const { createExpense, isLoading, error: mutationError, reset } = useCreateExpense();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setError(null);
    reset();

    const parsed = expenseSchema.safeParse({
      amount,
      category,
      description,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the expense details');
      return;
    }

    try {
      await createExpense({
        input: parsed.data,
        localPhotoUri,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save expense');
    }
  }

  return (
    <Screen
      title="Add expense"
      error={error ?? mutationError}
      footer={
        <PrimaryButton label="Save" onPress={() => void onSave()} isLoading={isLoading} />
      }
    >
      <ExpenseForm
        amount={amount}
        category={category}
        description={description}
        storedPhotoPath={null}
        localPhotoUri={localPhotoUri}
        removeStoredPhoto={false}
        onChangeAmount={setAmount}
        onChangeCategory={setCategory}
        onChangeDescription={setDescription}
        onChangeLocalPhotoUri={setLocalPhotoUri}
        onRemoveStoredPhoto={() => undefined}
      />
    </Screen>
  );
}
