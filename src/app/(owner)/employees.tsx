import { Text, View } from 'react-native';

import { useEmployees } from '@/features/employees/hooks/use-employees';
import { EmptyState } from '@/shared/components/EmptyState';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

export default function EmployeesScreen() {
  const { employees, isLoading, error, refetch } = useEmployees();

  return (
    <Screen
      title="Employees"
      isLoading={isLoading}
      error={error}
      footer={
        error ? (
          <PrimaryButton label="Retry" variant="secondary" onPress={() => void refetch()} />
        ) : null
      }
    >
      {employees.length === 0 ? (
        <EmptyState
          title="Employee roster"
          description="Add workers here in the next feature pass. Roster is separate from login profiles."
        />
      ) : (
        <View className="gap-3">
          {employees.map((employee) => (
            <View key={employee.id} className="rounded-2xl bg-white px-4 py-4">
              <Text className="text-lg font-semibold text-brand-900">{employee.name}</Text>
              <Text className="mt-1 text-body-lg text-slate-600">
                {employee.phone ?? 'No phone'} · {employee.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
