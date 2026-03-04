import React, { useState } from 'react';
import { Box } from 'ink';
import { ProjectList } from './ProjectList.js';
import { ConversationList } from './ConversationList.js';
import { ConversationPreview } from './ConversationPreview.js';
import { SearchResults } from './SearchResults.js';
import { Conversation } from '../../../providers/types.js';

enum BrowserView {
  Projects = 'projects',
  Conversations = 'conversations',
  Preview = 'preview',
  Search = 'search'
}

interface BrowserProps {
  conversations: Conversation[];
  onExport: (selectedConversations: Conversation[]) => void;
  onBack: () => void;
  onViewStats?: () => void;
  onChangeSource?: () => void;
}

export const Browser: React.FC<BrowserProps> = ({ conversations, onExport, onBack, onViewStats, onChangeSource }) => {
  const [view, setView] = useState<BrowserView>(BrowserView.Projects);
  const [lastView, setLastView] = useState<BrowserView>(BrowserView.Projects); // Track where we came from
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
  const [previewConversation, setPreviewConversation] = useState<Conversation | null>(null);

  // Helper to handle export
  const handleExportTrigger = () => {
    // Filter the conversations list to find the objects matching the selected UUIDs
    const toExport = conversations.filter(c => selectedUuids.includes(c.uuid));
    onExport(toExport);
  };

  return (
    <Box>
      {view === BrowserView.Projects && (
        <ProjectList
            conversations={conversations}
            onSelectProject={(project: string | null) => {
                setSelectedProject(project);
                setView(BrowserView.Conversations);
            }}
            onSearch={() => setView(BrowserView.Search)}
            onBack={onBack}
            onViewStats={onViewStats}
            onChangeSource={onChangeSource}
        />
      )}

      {view === BrowserView.Conversations && (
        <ConversationList
            conversations={conversations}
            projectName={selectedProject}
            selectedUuids={selectedUuids}
            onSelectionChange={setSelectedUuids}
            onSelectConversation={(conv: Conversation) => {
                setPreviewConversation(conv);
                setLastView(BrowserView.Conversations);
                setView(BrowserView.Preview);
            }}
            onExport={handleExportTrigger}
            onBack={() => setView(BrowserView.Projects)}
            onViewStats={onViewStats}
            onChangeSource={onChangeSource}
        />
      )}

      {view === BrowserView.Search && (
          <SearchResults
             conversations={conversations}
             onSelectConversation={(conv: Conversation) => {
                 setPreviewConversation(conv);
                 setLastView(BrowserView.Search);
                 setView(BrowserView.Preview);
             }}
             onBack={() => setView(BrowserView.Projects)}
          />
      )}

      {view === BrowserView.Preview && previewConversation && (
          <ConversationPreview
            conversation={previewConversation}
            onBack={() => setView(lastView)}
          />
      )}
    </Box>
  );
};
