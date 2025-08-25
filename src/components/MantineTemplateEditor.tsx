import { useMemo, useState, useEffect } from 'react';
import { Table, Anchor, Modal, Textarea, Button, Group, Badge, Text } from '@mantine/core';

export type TemplateRow = {
  label: string;
  content: string; // May include placeholders like {{name}}
};

export type MantineTemplateEditorProps = {
  rows?: TemplateRow[];
  title?: string;
  placeholderLabel?: string;
  onValuesChange?: (values: Record<string, string>) => void;
  initialValues?: Record<string, string>;
};

const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g;

const defaultRows: TemplateRow[] = [
  { label: 'Ticket ID', content: '{{ticket_key}}' },
  { label: 'Ticket Name', content: '{{ticket_name}}' },
  { label: 'Log Source', content: '{{log_source}}' },
  { label: 'Alert Date', content: '{{date_of_incident}}' },
  { label: 'Severity Level', content: '{{priority}}' },
  {
    label: 'Entity',
    content: 'Source IP: {{src_ip}}\nAsset Hostname: {{device_hostname}}\nUsername: {{username}}',
  },
  {
    label: 'Description',
    content:
      'Threat Category: *Compromise*\n{{incident_description}}\nSaat ini, {{log_source}} telah melakukan tindakan {{action_taken}} terhadap file trojan berikut.',
  },
  {
    label: 'Threat Indicators',
    content:
      '1. IP analysis: {{ip_analysis}}\n2. Domain analysis: {{domain_analysis}}\n3. Filehash analysis: {{filehash_analysis}}',
  },
  { label: 'Technical Recommendation', content: '{{recommendation_action}}' },
];

function splitByPlaceholders(text: string) {
  const parts: Array<{ type: 'text' | 'placeholder'; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
    const [full, key] = match;
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'placeholder', value: key.trim() });
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  if (parts.length === 0) parts.push({ type: 'text', value: text });
  return parts;
}

export default function MantineTemplateEditor({
  rows,
  title = 'Incident Template',
  placeholderLabel = 'Insert value',
  onValuesChange,
  initialValues,
}: MantineTemplateEditorProps) {
  const effectiveRows = rows && rows.length > 0 ? rows : defaultRows;

  const [values, setValues] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');

  const allPlaceholders = useMemo(() => {
    const set = new Set<string>();
    effectiveRows.forEach((r) => {
      for (const match of r.content.matchAll(PLACEHOLDER_REGEX)) {
        const key = String(match[1]).trim();
        set.add(key);
      }
    });
    return Array.from(set);
  }, [effectiveRows]);

  useEffect(() => {
    if (!initialValues) return;
    // Only apply keys that exist in this template
    const seeded: Record<string, string> = {};
    allPlaceholders.forEach((k) => {
      if (typeof initialValues[k] === 'string') seeded[k] = initialValues[k];
    });
    setValues((prev) => ({ ...prev, ...seeded }));
  }, [initialValues, allPlaceholders]);

  function openEditor(key: string) {
    setActiveKey(key);
    setDraft(values[key] ?? '');
  }

  function saveDraft() {
    if (!activeKey) return;
    const next = { ...values, [activeKey]: draft };
    setValues(next);
    onValuesChange?.(next);
    setActiveKey(null);
  }

  function renderContent(text: string) {
    const parts = splitByPlaceholders(text);
    return (
      <>
        {parts.map((p, idx) =>
          p.type === 'text' ? (
            <span key={idx}>{p.value}</span>
          ) : values[p.value] ? (
            <Badge key={idx} component="span" variant="light" color="teal" style={{ cursor: 'pointer' }} onClick={() => openEditor(p.value)}>
              {values[p.value]}
            </Badge>
          ) : (
            <Anchor key={idx} c="blue" underline="always" onClick={() => openEditor(p.value)}>
              {`{{${p.value}}}`}
            </Anchor>
          )
        )}
      </>
    );
  }

  return (
    <>
      <Text fw={600} fz="lg" mb="xs">{title}</Text>
      <Table withTableBorder withColumnBorders>
        <Table.Tbody>
          {effectiveRows.map((row, i) => (
            <Table.Tr key={i}>
              <Table.Td w={220} style={{ whiteSpace: 'nowrap' }}>
                <Text fw={600}>{row.label}</Text>
              </Table.Td>
              <Table.Td>
                <div style={{ whiteSpace: 'pre-wrap' }}>{renderContent(row.content)}</div>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={!!activeKey} onClose={() => setActiveKey(null)} title={activeKey ? `${placeholderLabel}: {{${activeKey}}}` : placeholderLabel} centered>
        <Textarea
          minRows={3}
          autosize
          placeholder={activeKey ? `Enter value for {{${activeKey}}}` : 'Enter value'}
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setActiveKey(null)}>Cancel</Button>
          <Button onClick={saveDraft}>Save</Button>
        </Group>
      </Modal>

      {allPlaceholders.length > 0 && (
        <Group gap="xs" mt="md">
          <Text fz="sm" c="dimmed">Placeholders:</Text>
          {allPlaceholders.map((k) => (
            <Badge key={k} component="span" variant={values[k] ? 'light' : 'outline'} onClick={() => openEditor(k)} style={{ cursor: 'pointer' }}>
              {k}
            </Badge>
          ))}
        </Group>
      )}
    </>
  );
} 