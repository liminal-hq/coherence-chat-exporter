import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { MainMenu } from './components/MainMenu.js';
import { FullScreenLayout } from './components/FullScreenLayout.js';
import { ProviderSelect } from './components/ProviderSelect.js';
import { ProgressBar } from './components/ProgressBar.js';
import { FileBrowser } from './components/FileBrowser.js';
import { TaggingSetup } from './components/TaggingSetup.js';
import { Settings } from './components/Settings.js';
import { Browser } from './components/browser/Browser.js';
import { StatsDashboard } from './components/stats/StatsDashboard.js';
import { ClaudeProvider } from '../providers/claude.js';
import { ChatGPTProvider } from '../providers/chatgpt.js';
import { ExportPipeline } from '../export/pipeline.js';
import { MarkdownTransformer } from '../export/transformer.js';
import { Organizer } from '../export/organizer.js';
import { Writer } from '../export/writer.js';
import { ConversationTagger } from '../tagging/classifier.js';
import { configManager } from '../config-manager.js';
import { InputResolver } from '../utils/input-resolver.js';
import { Conversation } from '../providers/types.js';

enum AppView {
  Menu = 'menu',
  SelectProvider = 'select-provider',
  InputPath = 'input-path',
  Loading = 'loading',
  Browser = 'browser',
  Stats = 'stats',
  Exporting = 'exporting',
  Complete = 'complete',
  TaggingSetup = 'tagging-setup',
  Settings = 'settings'
}

enum AppMode {
  Export = 'export',
  Browse = 'browse',
  Stats = 'stats'
}

enum MenuOption {
  Source = 'source',
  Browse = 'browse',
  Stats = 'stats',
  Tagging = 'tagging',
  Settings = 'settings',
  Exit = 'exit'
}

interface AppProps {
  onExit?: () => void;
}

export const App: React.FC<AppProps> = ({ onExit }) => {
  const [view, setView] = useState<AppView>(AppView.Menu);
  const [mode, setMode] = useState<AppMode>(AppMode.Export); // Track if we are in direct export or browse mode
  const [providerName, setProviderName] = useState<'claude' | 'chatgpt' | null>(null);
  const [status, setStatus] = useState('');
  const [exportCount, setExportCount] = useState(0);

  // Data state
  const [sessionPath, setSessionPath] = useState<string | null>(null);
  const [loadedConversations, setLoadedConversations] = useState<Conversation[]>([]);

  // Load config on mount
  useEffect(() => {
      configManager.loadConfig();
  }, []);

  const handleMenuSelect = (value: string) => {
    if (value === MenuOption.Exit) {
        if (onExit) onExit();
        else process.exit(0);
        return;
    }
    if (value === MenuOption.Source) {
        setMode(AppMode.Export);
        // If we have a session path, allow user to confirm or change
        if (sessionPath) {
             // For export flow, we might want to confirm specific file even if path is known
             // But let's assume if they picked Source they might want to change it.
             // Actually per requirements: "from the export view we can have an option there to change the location"
             // So we go to provider select -> path input (which shows current path as default or starts browser)
             setView(AppView.SelectProvider);
        } else {
             setView(AppView.SelectProvider);
        }
    }
    if (value === MenuOption.Browse) {
        setMode(AppMode.Browse);
        if (sessionPath && loadedConversations.length > 0) {
            setView(AppView.Browser);
        } else {
            setView(AppView.SelectProvider);
        }
    }
    if (value === MenuOption.Stats) {
        setMode(AppMode.Stats);
        if (sessionPath && loadedConversations.length > 0) {
            setView(AppView.Stats);
        } else {
            setView(AppView.SelectProvider);
        }
    }
    if (value === MenuOption.Tagging) setView(AppView.TaggingSetup);
    if (value === MenuOption.Settings) setView(AppView.Settings);
  };

  const handleProviderSelect = (provider: 'claude' | 'chatgpt') => {
    setProviderName(provider);
    // If we have a session path and we are just re-entering browse/stats, maybe we should skip input?
    // But if they came from ProviderSelect, they likely want to confirm/change.
    // Let's go to input path, but maybe FileBrowser handles pre-filled path?
    setView(AppView.InputPath);
  };

  const handleChangeSource = () => {
      // Keep provider, just go back to input path
      setView(AppView.InputPath);
  };

  const handlePathSubmit = async (pathStr: string) => {
      setSessionPath(pathStr); // Remember this path for the session

      if (mode === AppMode.Export) {
        setView(AppView.Exporting);
        setStatus('Initializing export...');
        try {
            await runDirectExport(pathStr);
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
      } else {
          // Browse or Stats mode
          setView(AppView.Loading);
          setStatus('Loading conversations...');
          try {
              await loadDataForBrowsing(pathStr);
          } catch (e: any) {
              setStatus(`Error: ${e.message}`);
          }
      }
  };

  const loadDataForBrowsing = async (pathStr: string) => {
    if (!providerName) return;
    const provider = providerName === 'claude' ? new ClaudeProvider() : new ChatGPTProvider();
    const resolver = new InputResolver();

    setStatus('Resolving input...');
    const rawData = await resolver.resolve(pathStr);

    setStatus('Parsing data...');
    const conversations = await provider.normalize(rawData);

    setLoadedConversations(conversations);
    if (mode === AppMode.Stats) {
        setView(AppView.Stats);
    } else {
        setView(AppView.Browser);
    }
  };

  const runDirectExport = async (pathStr: string) => {
      if (!providerName) return;
      const resolver = new InputResolver();
      const rawData = await resolver.resolve(pathStr);
      await executeExport(rawData);
  };

  const executeExport = async (data: any, specificConversations?: Conversation[]) => {
      if (!providerName) return;

      const config = configManager.getConfig();
      const provider = providerName === 'claude' ? new ClaudeProvider() : new ChatGPTProvider();
      const transformer = new MarkdownTransformer();
      const organizer = new Organizer(config.outputPath);
      const writer = new Writer();

      let tagger: ConversationTagger | undefined;
      if (config.tagging.enabled) {
          setStatus('Loading AI Model...');
          tagger = new ConversationTagger();
          await tagger.initialize();
      }

      const pipeline = new ExportPipeline(provider, transformer, organizer, writer, tagger);

      setStatus(`Exporting...`);

      const inputData = specificConversations || data;

      const results = await pipeline.export(inputData, {
          enableTagging: config.tagging.enabled,
          tagThreshold: config.tagging.threshold
      });

      setExportCount(results.length);
      setView(AppView.Complete);
  };

  const handleBrowserExport = async (selectedConversations: Conversation[]) => {
      if (selectedConversations.length === 0) return;
      setView(AppView.Exporting);
      setStatus(`Exporting ${selectedConversations.length} conversations...`);

      try {
        await executeExport(null, selectedConversations);
      } catch (e: any) {
        setStatus(`Error: ${e.message}`);
      }
  };

  const config = configManager.getConfig();

  return (
    <FullScreenLayout>
      {view === AppView.Menu && <MainMenu onSelect={handleMenuSelect} />}
      {view === AppView.SelectProvider && (
          <ProviderSelect onSelect={handleProviderSelect} onBack={() => setView(AppView.Menu)} />
      )}
      {view === AppView.InputPath && (
          <FileBrowser
            prompt={`Select ${providerName} export directory or file:`}
            onSubmit={handlePathSubmit}
            onCancel={() => setView(AppView.SelectProvider)}
          />
      )}
      {view === AppView.Loading && <ProgressBar status={status} />}

      {view === AppView.Browser && (
          <Browser
            conversations={loadedConversations}
            onExport={handleBrowserExport}
            onBack={() => setView(AppView.Menu)}
            onViewStats={() => setView(AppView.Stats)}
            onChangeSource={handleChangeSource}
          />
      )}

      {view === AppView.Stats && (
          <StatsDashboard
            conversations={loadedConversations}
            onBack={() => {
                if (mode === AppMode.Browse) setView(AppView.Browser);
                else setView(AppView.Menu);
            }}
            onChangeSource={handleChangeSource}
          />
      )}

      {view === AppView.TaggingSetup && (
          <TaggingSetup onBack={() => setView(AppView.Menu)} />
      )}
      {view === AppView.Settings && (
          <Settings onBack={() => setView(AppView.Menu)} />
      )}
      {view === AppView.Exporting && <ProgressBar status={status} />}
      {view === AppView.Complete && (
          <Box flexDirection="column" padding={1}>
              <Text color="green">✔ Export Complete!</Text>
              <Text>Processed {exportCount} conversations.</Text>
              <Text>Output saved to {config.outputPath}</Text>
          </Box>
      )}
    </FullScreenLayout>
  );
};
