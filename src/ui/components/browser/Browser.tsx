import React, { useState } from 'react';
import { Box } from 'ink';
import { ProjectList } from './ProjectList.js';
import { ConversationList } from './ConversationList.js';
import { ConversationPreview } from './ConversationPreview.js';
import { Conversation } from '../../../providers/types.js';

type BrowserView = 'projects' | 'conversations' | 'preview';

interface BrowserProps {
  conversations: Conversation[];
  onExport: (selectedConversations: Conversation[]) => void;
  onBack: () => void;
  onViewStats?: () => void;
  onChangeSource?: () => void;
}

export const Browser: React.FC<BrowserProps> = ({ conversations, onExport, onBack, onViewStats, onChangeSource }) => {
  const [view, setView] = useState<BrowserView>('projects');
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
      {view === 'projects' && (
        <ProjectList
            conversations={conversations}
            onSelectProject={(project: string | null) => {
                setSelectedProject(project);
                setView('conversations');
            }}
            onBack={onBack}
            onViewStats={onViewStats}
            onChangeSource={onChangeSource}
        />
      )}

      {view === 'conversations' && (
        <ConversationList
            conversations={conversations}
            projectName={selectedProject}
            selectedUuids={selectedUuids}
            onSelectionChange={setSelectedUuids}
            onSelectConversation={(conv: Conversation) => {
                setPreviewConversation(conv);
                setView('preview');
            }}
            onExport={handleExportTrigger}
            onBack={() => setView('projects')}
            onViewStats={onViewStats}
            onChangeSource={onChangeSource}
        />
      )}

      {view === 'preview' && previewConversation && (
          <ConversationPreview
            conversation={previewConversation}
            onBack={() => setView('conversations')}
          />
      )}
    </Box>
  );
};
