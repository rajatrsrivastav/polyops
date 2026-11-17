import { View } from 'react-native';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return <View className={`rounded-2xl bg-slate-200 ${className}`} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <View key={`skeleton-${index}`} className="rounded-2xl bg-white px-4 py-4">
          <Skeleton className="mb-3 h-5 w-48" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-32" />
        </View>
      ))}
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-6 w-40" />
      <View className="flex-row gap-3">
        <Skeleton className="h-28 flex-1" />
        <Skeleton className="h-28 flex-1" />
      </View>
      <View className="flex-row gap-3">
        <Skeleton className="h-28 flex-1" />
        <Skeleton className="h-28 flex-1" />
      </View>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </View>
  );
}
