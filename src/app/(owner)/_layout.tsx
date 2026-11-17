import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { AuthGate } from '@/features/auth/components/AuthGate';
import { useTranslation } from '@/i18n';

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text className={`text-xs ${focused ? 'font-bold text-brand-700' : 'text-slate-500'}`}>
      {label}
    </Text>
  );
}

/**
 * Owner-only shell. Employees hitting these routes are redirected by AuthGate.
 */
export default function OwnerLayout() {
  const { t } = useTranslation();

  return (
    <AuthGate allow={['owner']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1d4ed8',
          tabBarStyle: { height: 68, paddingBottom: 10, paddingTop: 8 },
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('owner.home'),
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label={t('owner.home')} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: t('owner.expenses'),
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label={t('owner.expenses')} />
            ),
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: t('owner.attendance'),
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label={t('owner.attendance')} />
            ),
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: t('owner.documents'),
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label={t('owner.documents')} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: t('owner.reports'),
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label={t('owner.reports')} />
            ),
          }}
        />
        <Tabs.Screen name="employees" options={{ href: null, title: t('owner.employees') }} />
        <Tabs.Screen name="expense-new" options={{ href: null, title: 'Add expense' }} />
        <Tabs.Screen name="expense-edit/[id]" options={{ href: null, title: 'Edit expense' }} />
        <Tabs.Screen name="customer-new" options={{ href: null, title: 'Add customer' }} />
        <Tabs.Screen name="customer-edit/[id]" options={{ href: null, title: 'Edit customer' }} />
        <Tabs.Screen name="invoice-new" options={{ href: null, title: 'New invoice' }} />
        <Tabs.Screen name="invoice/[id]" options={{ href: null, title: 'Invoice' }} />
        <Tabs.Screen name="challan-new" options={{ href: null, title: 'New challan' }} />
        <Tabs.Screen name="challan/[id]" options={{ href: null, title: 'Challan' }} />
      </Tabs>
    </AuthGate>
  );
}
