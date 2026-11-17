import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import {
  useDeleteExpense,
  useExpense,
  useUpdateExpense,
} from '@/features/expenses/hooks/use-expenses';
import {
  EXPENSE_CATEGORIES,
  expenseCategorySchema,
  expenseSchema,
  type ExpenseCategory,
} from '@/features/expenses/schemas/expense-schema';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

function asExpenseId(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return null;
}

export default function ExpenseEditScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const expenseId = asExpenseId(params.id);
  const { expense, isLoading, error: loadError } = useExpense(expenseId);
  const { updateExpense, isLoading: saving, error: saveError, reset: resetSave } =
    useUpdateExpense();
  const { deleteExpense, isLoading: deleting, error: deleteError, reset: resetDelete } =
    useDeleteExpense();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [removeStoredPhoto, setRemoveStoredPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!expense || hydrated) return;
    setAmount(String(expense.amount));
    const parsedCategory = expenseCategorySchema.safeParse(expense.category);
    setCategory(parsedCategory.success ? parsedCategory.data : EXPENSE_CATEGORIES[0]);
    setDescription(expense.description ?? '');
    setHydrated(true);
  }, [expense, hydrated]);

  async function onSave() {
    if (!expenseId || !expense) return;
    setError(null);
    resetSave();

    const parsed = expenseSchema.safeParse({
      amount,
      category,
      description,
      photo_url: removeStoredPhoto ? null : expense.photo_url,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the expense details');
      return;
    }

    try {
      await updateExpense({
        expenseId,
        input: parsed.data,
        localPhotoUri,
        previousPhotoPath: expense.photo_url,
        removePhoto: removeStoredPhoto && !localPhotoUri,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update expense');
    }
  }

  function confirmDelete() {
    if (!expense) return;
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setError(null);
            resetDelete();
            try {
              await deleteExpense(expense);
              router.back();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not delete expense');
            }
          })();
        },
      },
    ]);
  }

  if (!expenseId) {
    return (
      <Screen title="Edit expense" error="Missing expense id">
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Edit expense"
      isLoading={isLoading || !hydrated}
      error={error ?? loadError ?? saveError ?? deleteError}
      footer={
        <View className="gap-3">
          <PrimaryButton
            label="Save changes"
            onPress={() => void onSave()}
            isLoading={saving}
            disabled={deleting}
          />
          <PrimaryButton
            label="Delete"
            variant="secondary"
            onPress={confirmDelete}
            isLoading={deleting}
            disabled={saving}
          />
        </View>
      }
    >
      <ExpenseForm
        amount={amount}
        category={category}
        description={description}
        storedPhotoPath={expense?.photo_url ?? null}
        localPhotoUri={localPhotoUri}
        removeStoredPhoto={removeStoredPhoto}
        onChangeAmount={setAmount}
        onChangeCategory={setCategory}
        onChangeDescription={setDescription}
        onChangeLocalPhotoUri={(uri) => {
          setLocalPhotoUri(uri);
          if (uri) setRemoveStoredPhoto(false);
        }}
        onRemoveStoredPhoto={() => {
          setRemoveStoredPhoto(true);
          setLocalPhotoUri(null);
        }}
      />
    </Screen>
  );
}
