export const queryKeys = {
  expenses: {
    all: (factoryId: string) => ['expenses', factoryId] as const,
  },
  employees: {
    all: (factoryId: string) => ['employees', factoryId] as const,
  },
  attendance: {
    byDate: (factoryId: string, date: string) => ['attendance', factoryId, date] as const,
    byEmployee: (factoryId: string, employeeId: string) =>
      ['attendance', factoryId, 'employee', employeeId] as const,
    byMonth: (factoryId: string, monthKey: string) =>
      ['attendance', factoryId, 'month', monthKey] as const,
  },
  customers: {
    all: (factoryId: string) => ['customers', factoryId] as const,
  },
  invoices: {
    all: (factoryId: string) => ['invoices', factoryId] as const,
    detail: (factoryId: string, invoiceId: string) =>
      ['invoices', factoryId, invoiceId] as const,
  },
  challans: {
    all: (factoryId: string) => ['challans', factoryId] as const,
    detail: (factoryId: string, challanId: string) =>
      ['challans', factoryId, challanId] as const,
  },
};
