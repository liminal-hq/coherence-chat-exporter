import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { configManager } from '../../config-manager.js';

interface Props {
  onBack: () => void;
}

export const Settings: React.FC<Props> = ({ onBack }) => {
  const [config, setConfig] = useState(configManager.getConfig());
  const [msg, setMsg] = useState('');

  const items = [
      // For MVP, we only allow saving the current state (e.g. if tagging was toggled elsewhere)
      // or we could add toggles here.
      { label: `Output Path: ${config.outputPath} (Edit in config file)`, value: 'output' },
      { label: `AI Tagging Default: ${config.tagging.enabled ? 'ON' : 'OFF'}`, value: 'toggle_tagging' },
      { label: '💾 Save Configuration', value: 'save' },
      { label: '🔙 Back', value: 'back' }
  ];

  const handleSelect = async (item: any) => {
      if (item.value === 'back') {
          onBack();
      } else if (item.value === 'save') {
          await configManager.saveConfig(config);
          setMsg('Configuration saved!');
          setTimeout(() => setMsg(''), 2000);
      } else if (item.value === 'toggle_tagging') {
          const newConfig = { ...config };
          newConfig.tagging.enabled = !newConfig.tagging.enabled;
          // Optimistic update only. User must select "Save Configuration" to persist.
          setConfig(newConfig);
          setMsg('Tagging toggled (Select Save to persist)');
      }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Settings</Text>
      <Box marginY={1}>
          <Text color="gray">Configuration loaded from: ~/.config/chat-archive/config.json</Text>
      </Box>
      <SelectInput items={items} onSelect={handleSelect} />
      {msg && <Text color="green">{msg}</Text>}
    </Box>
  );
};
