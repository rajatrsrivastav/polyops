import type { CustomerInput } from '@/features/customers/schemas/customer-schema';
import { getSupabase } from '@/shared/lib/supabase';
import type { Customer } from '@/shared/types/database';

export async function listCustomers(factoryId: string): Promise<Customer[]> {
  const { data, error } = await getSupabase()
    .from('customers')
    .select('*')
    .eq('factory_id', factoryId)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Customer[] | null) ?? [];
}

export async function getCustomer(factoryId: string, customerId: string): Promise<Customer> {
  const { data, error } = await getSupabase()
    .from('customers')
    .select('*')
    .eq('factory_id', factoryId)
    .eq('id', customerId)
    .single();

  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function createCustomer(params: {
  factoryId: string;
  input: CustomerInput;
}): Promise<Customer> {
  const { data, error } = await getSupabase()
    .from('customers')
    .insert({
      factory_id: params.factoryId,
      name: params.input.name,
      phone: params.input.phone || null,
      address: params.input.address || null,
      gstin: params.input.gstin || null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function updateCustomer(params: {
  factoryId: string;
  customerId: string;
  input: CustomerInput;
}): Promise<Customer> {
  const { data, error } = await getSupabase()
    .from('customers')
    .update({
      name: params.input.name,
      phone: params.input.phone || null,
      address: params.input.address || null,
      gstin: params.input.gstin || null,
    })
    .eq('factory_id', params.factoryId)
    .eq('id', params.customerId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Customer;
}
