import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { AuthGate } from '@/features/auth/components/AuthGate';

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text className={`text-xs ${focused ? 'font-bold text-brand-700' : 'text-slate-500'}`}>
      {label}
    </Text>
  );
}

/**
 * Employee-only shell — attendance is the only operational tab.
 */
export default function EmployeeLayout() {
  return (
    <AuthGate allow={['employee']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1d4ed8',
          tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
        }}
      >
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Attendance',
            tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Attendance" />,
          }}
        />
      </Tabs>
    </AuthGate>
  );
}
