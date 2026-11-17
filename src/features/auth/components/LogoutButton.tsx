import { useLogout } from '@/features/auth/hooks/use-logout';
import { useTranslation } from '@/i18n';
import { PrimaryButton } from '@/shared/components/PrimaryButton';

type LogoutButtonProps = {
  variant?: 'primary' | 'secondary';
};

export function LogoutButton({ variant = 'secondary' }: LogoutButtonProps) {
  const { logout, isLoading } = useLogout();
  const { t } = useTranslation();

  return (
    <PrimaryButton
      label={t('common.logout')}
      variant={variant}
      isLoading={isLoading}
      onPress={() => {
        void logout();
      }}
    />
  );
}
