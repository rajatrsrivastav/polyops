import { nextChallanNumber } from '@/features/documents/utils/document-numbers';
import type { ChallanInput } from '@/features/challans/schemas/challan-schema';
import { parseNumeric } from '@/shared/lib/parse-numeric';
import { getSupabase } from '@/shared/lib/supabase';
import type { Challan, ChallanItem, ChallanWithItems } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';

type ChallanItemRow = Omit<ChallanItem, 'qty'> & { qty: number | string };

function mapItem(row: ChallanItemRow): ChallanItem {
  return { ...row, qty: parseNumeric(row.qty) };
}

export { nextChallanNumber };

export async function listChallans(factoryId: string): Promise<Challan[]> {
  const { data, error } = await getSupabase()
    .from('challans')
    .select('*')
    .eq('factory_id', factoryId)
    .order('challan_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Challan[] | null) ?? [];
}

export async function getChallan(
  factoryId: string,
  challanId: string,
): Promise<ChallanWithItems> {
  const { data, error } = await getSupabase()
    .from('challans')
    .select('*, challan_items(*)')
    .eq('factory_id', factoryId)
    .eq('id', challanId)
    .single();

  if (error) throw new Error(error.message);

  const row = data as Challan & { challan_items: ChallanItemRow[] };
  return {
    ...row,
    challan_items: (row.challan_items ?? []).map(mapItem),
  };
}

export async function createChallan(params: {
  factoryId: string;
  input: ChallanInput;
}): Promise<ChallanWithItems> {
  const challanNumber =
    params.input.challan_number?.trim() || (await nextChallanNumber(params.factoryId));

  const { data: challan, error } = await getSupabase()
    .from('challans')
    .insert({
      client_id: createClientId(),
      factory_id: params.factoryId,
      customer_id: params.input.customer_id,
      challan_number: challanNumber,
      challan_date: params.input.challan_date,
      vehicle_no: params.input.vehicle_no || null,
      notes: params.input.notes || null,
      status: 'final',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  const challanId = (challan as Challan).id;
  const { data: items, error: itemsError } = await getSupabase()
    .from('challan_items')
    .insert(
      params.input.items.map((item) => ({
        challan_id: challanId,
        description: item.description,
        qty: item.qty,
        unit: item.unit || null,
      })),
    )
    .select('*');

  if (itemsError) throw new Error(itemsError.message);

  return {
    ...(challan as Challan),
    challan_items: (items as ChallanItemRow[]).map(mapItem),
  };
}
