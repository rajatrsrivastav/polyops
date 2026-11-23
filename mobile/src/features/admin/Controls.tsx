import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { Button, ErrorNotice, Loading, styles } from '../../components/ui';
import { InventorySearch, MaterialRow, Pager } from '../../components/inventory';
import type { Material, useMaterials } from './data';

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor="#67605A" accessibilityLabel={label} style={styles.input} />
    </View>
  );
}

export function MaterialPicker({ model, select, action, disabled, selected = [] }: {
  model: ReturnType<typeof useMaterials>;
  select: (material: Material) => void;
  action: string;
  disabled?: boolean;
  selected?: string[];
}) {
  const { query, page, setPage } = model;
  return (
    <>
      <InventorySearch value={model.search} change={model.setSearch} submit={model.submit} />
      {query.isPending && <Loading />}
      <ErrorNotice error={query.error} />
      {query.error && <Button title="Retry" secondary onPress={() => void query.refetch()} />}
      {query.data?.items.length === 0 && <Text style={styles.sub}>No matching materials.</Text>}
      {query.data?.items.map((material) => (
        <MaterialRow key={material._id} item={material} pricePaise={material.pricePaise}
          action={selected.includes(material._id) ? 'Already added' : action}
          disabled={disabled || selected.includes(material._id)} select={() => select(material)} />
      ))}
      {query.data && <Pager page={page} limit={query.data.limit} total={query.data.total} change={setPage} />}
    </>
  );
}
