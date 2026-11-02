import { StyleSheet, Text, View } from 'react-native';

import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors, fonts } from '@/constants/theme';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { formatIndiaMobileDisplay } from '@/utils/phoneValidation';

export default function ProfileScreen() {
  const { account } = useCustomerAccount();

  if (!account) {
    return (
      <PlaceholderScreen
        title="Profile"
        message="Account details appear here after registration is confirmed."
      />
    );
  }

  const mobile = account.mobile.length === 10 ? formatIndiaMobileDisplay(account.mobile) : account.mobile;

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <Text accessibilityRole="header" style={styles.title}>
          {account.name}
        </Text>
        <Text style={styles.note}>Details returned when this account was created.</Text>
        <View style={styles.card}>
          <Detail label="Mobile" value={mobile} />
          <Detail label="Customer ID" value={account.customerId} />
          {account.companyMobile ? <Detail label="Company mobile" value={account.companyMobile} /> : null}
        </View>
      </View>
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    paddingVertical: 12,
    gap: 2,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
});
