import type { ExpenseInput } from '@/features/expenses/schemas/expense-schema';
import { parseNumeric } from '@/shared/lib/parse-numeric';
import { getSupabase } from '@/shared/lib/supabase';
import type { Expense } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';

const BILL_PHOTOS_BUCKET = 'bill-photos';

type ExpenseRow = {
  id: string;
  client_id: string;
  factory_id: string;
  created_by: string;
  amount: number | string;
  category: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
};

export function mapExpense(row: ExpenseRow): Expense {
  return {
    ...row,
    amount: parseNumeric(row.amount),
  };
}

function mimeForUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

function extensionForUri(uri: string): string {
  const clean = uri.split('?')[0] ?? uri;
  const ext = clean.split('.').pop()?.toLowerCase();
  if (ext && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return 'jpg';
}

export async function listExpenses(factoryId: string): Promise<Expense[]> {
  const { data, error } = await getSupabase()
    .from('expenses')
    .select('*')
    .eq('factory_id', factoryId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ExpenseRow[] | null)?.map(mapExpense) ?? [];
}

export async function getExpense(factoryId: string, expenseId: string): Promise<Expense> {
  const { data, error } = await getSupabase()
    .from('expenses')
    .select('*')
    .eq('factory_id', factoryId)
    .eq('id', expenseId)
    .single();

  if (error) throw new Error(error.message);
  return mapExpense(data as ExpenseRow);
}

/** Uploads a local image and returns the storage object path (stored in photo_url). */
export async function uploadBillPhoto(factoryId: string, localUri: string): Promise<string> {
  const ext = extensionForUri(localUri);
  const path = `${factoryId}/${createClientId()}.${ext}`;
  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error('Could not read the selected photo');
  }
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await getSupabase()
    .storage.from(BILL_PHOTOS_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mimeForUri(localUri),
      upsert: false,
    });

  if (error) throw new Error(error.message);
  return path;
}

export async function getBillPhotoSignedUrl(path: string): Promise<string | null> {
  // Local preview URIs are not storage paths.
  if (path.startsWith('file:') || path.startsWith('content:') || path.startsWith('http')) {
    return path;
  }

  const { data, error } = await getSupabase()
    .storage.from(BILL_PHOTOS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}

export async function deleteBillPhoto(path: string | null | undefined): Promise<void> {
  if (!path || path.startsWith('file:') || path.startsWith('http')) return;
  const { error } = await getSupabase().storage.from(BILL_PHOTOS_BUCKET).remove([path]);
  if (error) {
    // Non-fatal: DB row can still be updated/deleted.
    console.warn('Failed to delete bill photo', error.message);
  }
}

export async function createExpense(params: {
  factoryId: string;
  userId: string;
  input: ExpenseInput;
  localPhotoUri?: string | null;
  clientId?: string;
}): Promise<Expense> {
  const clientId = params.clientId ?? createClientId();
  let photoPath = params.input.photo_url || null;

  if (params.localPhotoUri) {
    photoPath = await uploadBillPhoto(params.factoryId, params.localPhotoUri);
  }

  const { data, error } = await getSupabase()
    .from('expenses')
    .insert({
      client_id: clientId,
      factory_id: params.factoryId,
      created_by: params.userId,
      amount: params.input.amount,
      category: params.input.category,
      description: params.input.description || null,
      photo_url: photoPath,
    })
    .select('*')
    .single();

  if (error) {
    if (photoPath) await deleteBillPhoto(photoPath);
    throw new Error(error.message);
  }

  return mapExpense(data as ExpenseRow);
}

export async function updateExpense(params: {
  factoryId: string;
  expenseId: string;
  input: ExpenseInput;
  localPhotoUri?: string | null;
  previousPhotoPath?: string | null;
  removePhoto?: boolean;
}): Promise<Expense> {
  let photoPath = params.previousPhotoPath ?? null;

  if (params.removePhoto) {
    await deleteBillPhoto(photoPath);
    photoPath = null;
  } else if (params.localPhotoUri) {
    const uploaded = await uploadBillPhoto(params.factoryId, params.localPhotoUri);
    await deleteBillPhoto(photoPath);
    photoPath = uploaded;
  } else if (params.input.photo_url) {
    photoPath = params.input.photo_url;
  }

  const { data, error } = await getSupabase()
    .from('expenses')
    .update({
      amount: params.input.amount,
      category: params.input.category,
      description: params.input.description || null,
      photo_url: photoPath,
    })
    .eq('factory_id', params.factoryId)
    .eq('id', params.expenseId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapExpense(data as ExpenseRow);
}

export async function deleteExpense(params: {
  factoryId: string;
  expense: Expense;
}): Promise<void> {
  const { error } = await getSupabase()
    .from('expenses')
    .delete()
    .eq('factory_id', params.factoryId)
    .eq('id', params.expense.id);

  if (error) throw new Error(error.message);
  await deleteBillPhoto(params.expense.photo_url);
}
