import type { EmployeeInput } from '@/features/employees/schemas/employee-schema';
import { getSupabase } from '@/shared/lib/supabase';
import type { Employee } from '@/shared/types/database';

export async function listEmployees(factoryId: string): Promise<Employee[]> {
  const { data, error } = await getSupabase()
    .from('employees')
    .select('*')
    .eq('factory_id', factoryId)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Employee[] | null) ?? [];
}

export async function createEmployee(params: {
  factoryId: string;
  input: EmployeeInput;
}): Promise<Employee> {
  const { data, error } = await getSupabase()
    .from('employees')
    .insert({
      factory_id: params.factoryId,
      name: params.input.name,
      phone: params.input.phone || null,
      is_active: params.input.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Employee;
}
