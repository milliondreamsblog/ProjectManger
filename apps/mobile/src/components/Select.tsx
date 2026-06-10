import { Pressable, Text, View } from "react-native";
import { theme } from "../theme";

export interface Option {
  label: string;
  value: string;
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={{ fontSize: theme.font.small, color: theme.colors.muted, marginBottom: theme.spacing.xs }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        {options.length === 0 ? (
          <Text style={{ color: theme.colors.muted, fontSize: theme.font.small }}>
            {placeholder ?? "No options"}
          </Text>
        ) : null}
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.pill,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? `${theme.colors.primary}15` : "#fff",
              }}
            >
              <Text style={{ color: active ? theme.colors.primary : theme.colors.text, fontSize: theme.font.small }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
