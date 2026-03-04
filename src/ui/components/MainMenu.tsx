import React, { useMemo } from 'react';
import { Box, Text, useStdout } from 'ink';
import SelectInput from 'ink-select-input';
import figlet from 'figlet';
import gradient from 'gradient-string';

interface Props {
  onSelect: (value: string) => void;
  hasData?: boolean;
}

// ItemProps must match ink-select-input's definition which does NOT include 'value'
interface ItemProps {
    isSelected?: boolean;
    label: string;
}

// A more dramatic ASCII brain (side view with convolutions)
const BRAIN_ASCII = `
      _---~~(~~-._
    _{        )   )
   (   ) -~~- ( ,-' )_
  (  \`-,_..\`.,_--_ '_,)
  (_-  _  ~_-~~~~\`,  ,' )
    \`~ -^(    __;-,((()))
          ~~~~ {_ -_(())
                 \`\\  }
                   { }
`;

// Pinkish color from Noto Color Emoji brain
const BRAIN_PINK = "#F48FB1";

export const MainMenu: React.FC<Props> = ({ onSelect, hasData = false }) => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  // Generate the rainbow logo once
  const logo = useMemo(() => {
    const ascii = figlet.textSync('Coherence', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });
    return gradient.rainbow.multiline(ascii);
  }, []);

  const items = [
    { label: hasData ? '📦 Load New Source' : '📦 Load Export Data (Start Here)', value: 'source' },
    { label: '📂 Browse & Export', value: 'browse' },
    { label: '🔍 Search', value: 'search' },
    { label: '📊 Stats Dashboard', value: 'stats' },
    { label: '🏷️  Configure Tagging', value: 'tagging' },
    { label: '⚙️  Settings', value: 'settings' },
    { label: '🚪 Exit', value: 'exit' }
  ];

  // Threshold to hide the brain if terminal is too narrow
  // Coherence logo is roughly ~55 chars wide.
  // Menu is ~30 chars. New Brain is ~25 chars + margins.
  // We'll bump the threshold to 85 to be safe.
  const showBrain = width >= 85;

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Chat Archive Tool</Text>
      {/* Top Logo */}
      <Box marginBottom={1}>
        <Text>{logo}</Text>
      {!hasData && (
          <Box marginTop={1} borderStyle="single" borderColor="yellow">
              <Text color="yellow">No data loaded. Please load an export file to begin.</Text>
          </Box>
      )}
      </Box>

      {/* Content Area */}
      <Box flexDirection="row">
        {/* Left Column: Menu */}
        <Box flexDirection="column" marginRight={4}>
          <SelectInput
            items={items}
            onSelect={(item) => onSelect(item.value)}
            itemComponent={(props: ItemProps) => {
                // Determine disabled state based on label content since 'value' is not passed to itemComponent
                const label = props.label;
                const requiresData =
                    label.includes('Browse') ||
                    label.includes('Search') ||
                    label.includes('Stats');

                const isDisabled = requiresData && !hasData;

                return (
                    <Text color={props.isSelected ? 'cyan' : (isDisabled ? 'gray' : 'white')}>
                        {props.isSelected ? '> ' : '  '}
                        {props.label}
                        {isDisabled ? ' (Requires Data)' : ''}
                    </Text>
                );
            }}
        />
        </Box>

        {/* Right Column: Brain */}
        {showBrain && (
          <Box flexDirection="column" justifyContent="center">
            <Text color={BRAIN_PINK}>{BRAIN_ASCII}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
