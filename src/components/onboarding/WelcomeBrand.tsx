import { StyleSheet, View } from "react-native";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { colors, fonts } from "@/constants/theme";

export function WelcomeBrand() {
  return (
    <View style={styles.row}>
      <BrandLogo height={56} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    gap: 12,
  },
  aside: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.welcomeMuted,
  },
});
