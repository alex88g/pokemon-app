import React from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit?: (t: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
  testID?: string;
};

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  containerStyle,
  autoFocus,
  testID = 'search-bar',
}: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <TextInput
        mode="outlined"
        placeholder="Search Pokémon"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit?.(value)}
        blurOnSubmit={Platform.OS !== 'web'}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityRole="search"
        accessibilityLabel="Sökfält"
        placeholderTextColor={theme.colors.onSurfaceVariant}
        autoFocus={autoFocus}
        testID={testID}
        style={styles.input}
        outlineStyle={[styles.outline, { borderRadius: theme.roundness + 8 }]}
        left={<TextInput.Icon icon="magnify" />}
        right={
          value ? (
            <TextInput.Icon
              icon="close"
              accessibilityLabel="Rensa söktext"
              onPress={() => onChangeText('')}
              // web: rensa utan att flytta fokus
              forceTextInputFocus={false}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  input: {},
  outline: {},
});
