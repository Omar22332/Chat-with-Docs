/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// Fix: Corrected React import to destructure hooks and remove invalid syntax.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import KnowledgeBaseManager from './components/KnowledgeBaseManager';
import ChatInterface from './components/ChatInterface';
import ThemeSwitcher from './components/ThemeSwitcher';
import { URLGroup, ChatMessage, MessageSender, UrlContextMetadataItem } from './types';
import { v4 as uuidv4 } from 'uuid';
import { getInitialSuggestions, streamContentWithUrlContext } from './services/geminiService';
import { Menu } from 'lucide-react';
// import LanguageSwitcher from './components/LanguageSwitcher';

type Theme = 'light' | 'dark';

const defaultUrlGroups: URLGroup[] = [
  {
    id: '1',
    name: 'Gemini API Docs',
    urls: ['https://ai.google.dev/docs/gemini_api_overview', 'https://ai.google.dev/tutorials/get_started_node'],
    isEditable: false,
  },
];


/**
 * Processes the full text of a model's response to inject citation numbers
 * based on the grounding attributions provided by the API.
 * @param fullText The complete text response from the model.
 * @param attributions An array of grounding attribution objects.
 * @param chunks An array of grounding chunk objects containing source URIs.
 * @returns An object containing the text with citations and an ordered list of cited sources.
 */
const processAttributions = (
  fullText: string,
  attributions: any[],
  chunks: any[]
): { processedText: string; finalUrlContext: UrlContextMetadataItem[] } => {
  if (!attributions || attributions.length === 0 || !chunks || chunks.length === 0) {
    // Fallback for non-grounded responses: create a simple unique list of sources.
    const finalUrlContext: UrlContextMetadataItem[] = [];
    const seenUrls = new Set<string>();
    chunks.forEach(chunk => {
      const uri = chunk.web?.uri || chunk.retrievedContext?.uri;
      if (uri && !seenUrls.has(uri)) {
        seenUrls.add(uri);
        finalUrlContext.push({ retrievedUrl: uri, urlRetrievalStatus: 'SUCCESS' });
      }
    });
    return { processedText: fullText, finalUrlContext };
  }

  const urlToCitation: Record<string, number> = {};
  const citedSources: UrlContextMetadataItem[] = [];
  let citationCounter = 1;

  const replacements: { index: number; text: string }[] = [];

  for (const attr of attributions) {
    const content = attr.content;
    const chunkIndex = attr.sourceId?.chunkIndex;

    if (content === undefined || chunkIndex === undefined || chunkIndex >= chunks.length) {
      continue;
    }

    const chunk = chunks[chunkIndex];
    const uri = chunk.web?.uri || chunk.retrievedContext?.uri;

    if (!uri) continue;

    let citationNumber: number;
    if (uri in urlToCitation) {
      citationNumber = urlToCitation[uri];
    } else {
      citationNumber = citationCounter++;
      urlToCitation[uri] = citationNumber;
      // Ensure the final list is ordered by citation number
      citedSources[citationNumber - 1] = { retrievedUrl: uri, urlRetrievalStatus: 'SUCCESS' };
    }
    
    // Find the first occurrence of the attributed content that is not already cited.
    let searchFromIndex = 0;
    let matchIndex = -1;
    while ((matchIndex = fullText.indexOf(content, searchFromIndex)) !== -1) {
      const nextCharIndex = matchIndex + content.length;
      // Check if the match is already followed by a citation like ` [1]` to avoid duplicates.
      if (!/^\s*\[\d+\]/.test(fullText.substring(nextCharIndex))) {
        replacements.push({ index: nextCharIndex, text: ` [${citationNumber}]` });
        break; // Use the first valid match for this attribution
      }
      searchFromIndex = matchIndex + 1; // Continue searching after the current invalid match
    }
  }

  // Sort replacements by index in descending order to avoid messing up indices.
  replacements.sort((a, b) => b.index - a.index);
  
  let processedText = fullText;
  for (const rep of replacements) {
    processedText = processedText.slice(0, rep.index) + rep.text + processedText.slice(rep.index);
  }
  
  // Filter out any empty slots if some citations were invalid
  const finalUrlContext = citedSources.filter(Boolean);

  return { processedText, finalUrlContext };
}


const App: React.FC = () => {
  // Fix: Use React's useState hook directly, removing the incorrect 'aistudio' prefix.
  const [theme, setTheme] = useState<Theme>('light');
  
  // Fix: Use React's useState hook directly, removing the incorrect 'aistudio' prefix.
  const [urlGroups, setUrlGroups] = useState<URLGroup[]>(() => {
    try {
      const savedGroups = localStorage.getItem('knowledgeBaseGroups');
      if (savedGroups) {
        return JSON.parse(savedGroups);
      }
    } catch (error) {
      console.error('Failed to parse URL groups from localStorage', error);
    }
    return defaultUrlGroups;
  });

  // Fix: Use React's useState hook directly, removing the incorrect 'aistudio' prefix.
  const [activeUrlGroupId, setActiveUrlGroupId] = useState<string | null>(() => {
      // Initialize with the first group's ID, whether from storage or default
      const firstGroup = urlGroups[0];
      return firstGroup ? firstGroup.id : null;
  });
  
  const [allConversations, setAllConversations] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const savedConversations = localStorage.getItem('chatConversations');
      return savedConversations ? JSON.parse(savedConversations) : {};
    } catch (error) {
      console.error('Failed to parse conversations from localStorage', error);
      return {};
    }
  });

  // Fix: Use React's useState hook directly, removing the incorrect 'aistudio' prefix.
  const [isLoading, setIsLoading] = useState(false);
  // Fix: Use React's useState hook directly, removing the incorrect 'aistudio' prefix.
  const [initialSuggestions, setInitialSuggestions] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fix: Use React's useEffect hook directly, removing the incorrect 'aistudio' prefix.
  useEffect(() => {
    // Read theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
    }
  }, []);

  // Fix: Use React's useEffect hook directly, removing the incorrect 'aistudio' prefix.
  useEffect(() => {
    const hljsThemeElement = document.getElementById('hljs-theme') as HTMLLinkElement;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (hljsThemeElement) {
        hljsThemeElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
      }
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (hljsThemeElement) {
        hljsThemeElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
      }
    }
  }, [theme]);
  
  // Fix: Use React's useEffect hook directly, removing the incorrect 'aistudio' prefix.
  useEffect(() => {
    // Persist URL groups to localStorage whenever they change
    try {
      localStorage.setItem('knowledgeBaseGroups', JSON.stringify(urlGroups));
    } catch (error) {
      console.error('Failed to save URL groups to localStorage', error);
    }
  }, [urlGroups]);

  // Persist conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chatConversations', JSON.stringify(allConversations));
    } catch (error) {
      console.error('Failed to save conversations to localStorage', error);
    }
  }, [allConversations]);

  // Sync conversations with URL groups (remove conversations for deleted groups)
  useEffect(() => {
    const existingGroupIds = new Set(urlGroups.map(g => g.id));
    const conversationKeys = Object.keys(allConversations);
    let conversationsChanged = false;
    const newConversations = { ...allConversations };

    for (const groupId of conversationKeys) {
      if (!existingGroupIds.has(groupId)) {
        delete newConversations[groupId];
        conversationsChanged = true;
      }
    }

    if (conversationsChanged) {
      setAllConversations(newConversations);
    }
  }, [urlGroups]); // Dependency array intentionally excludes allConversations to avoid re-running on its own changes


  const activeUrls = urlGroups.find(g => g.id === activeUrlGroupId)?.urls || [];

  // Fix: Use React's useCallback hook directly, removing the incorrect 'aistudio' prefix.
  const fetchSuggestions = useCallback(async () => {
    if (activeUrls.length > 0) {
      setIsLoading(true);
      setInitialSuggestions([]);
      try {
        const response = await getInitialSuggestions(activeUrls);
        const suggestionsData = JSON.parse(response.text);
        setInitialSuggestions(suggestionsData.suggestions || []);
      } catch (error) {
        console.error('Failed to fetch initial suggestions:', error);
        setInitialSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setInitialSuggestions([]);
    }
  }, [activeUrls]);

  const currentMessages = useMemo(() => {
    return activeUrlGroupId ? allConversations[activeUrlGroupId] || [] : [];
  }, [allConversations, activeUrlGroupId]);

  useEffect(() => {
    // Fetch initial suggestions if the current chat is empty
    if (currentMessages.length === 0) {
      fetchSuggestions();
    }
  }, [currentMessages, fetchSuggestions]);

  const handleToggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleSendMessage = async (prompt: string) => {
    if (!prompt.trim() || !activeUrlGroupId) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      text: prompt,
      sender: MessageSender.USER,
      timestamp: new Date().toISOString(),
    };
    
    setAllConversations(prev => ({
      ...prev,
      [activeUrlGroupId]: [...(prev[activeUrlGroupId] || []), userMessage],
    }));

    setIsLoading(true);

    const modelMessageId = uuidv4();
    const modelMessage: ChatMessage = {
      id: modelMessageId,
      text: '',
      sender: MessageSender.MODEL,
      timestamp: new Date().toISOString(),
      isLoading: true,
      urlContext: [],
      isError: false,
    };
    
    setAllConversations(prev => ({
      ...prev,
      [activeUrlGroupId]: [...(prev[activeUrlGroupId] || []), modelMessage],
    }));

    try {
      const stream = await streamContentWithUrlContext(prompt, activeUrls);
      let fullText = '';
      const allChunks: any[] = [];
      const allAttributions: any[] = [];
      
      for await (const chunk of stream) {
        fullText += chunk.text;
        
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            allChunks.push(...chunk.candidates[0].groundingMetadata.groundingChunks);
        }
        // Fix: Corrected property access for grounding attributions.
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingAttributions) {
            allAttributions.push(...chunk.candidates[0].groundingMetadata.groundingAttributions);
        }
        
        // Update state with streaming text
        setAllConversations(prev => {
          const updatedMessages = (prev[activeUrlGroupId] || []).map(msg =>
            msg.id === modelMessageId
              ? { ...msg, text: fullText }
              : msg
          );
          return { ...prev, [activeUrlGroupId]: updatedMessages };
        });
      }

      // After the stream is complete, process the text for citations.
      const { processedText, finalUrlContext } = processAttributions(fullText, allAttributions, allChunks);

      // Update the message with the final processed text and ordered sources.
      setAllConversations(prev => {
        const updatedMessages = (prev[activeUrlGroupId] || []).map(msg =>
          msg.id === modelMessageId ? { ...msg, text: processedText, urlContext: finalUrlContext } : msg
        );
        return { ...prev, [activeUrlGroupId]: updatedMessages };
      });


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setAllConversations(prev => {
        const updatedMessages = (prev[activeUrlGroupId] || []).map(msg =>
          msg.id === modelMessageId ? { ...msg, text: errorMessage, isError: true } : msg
        );
        return { ...prev, [activeUrlGroupId]: updatedMessages };
      });
    } finally {
      setIsLoading(false);
      // Final update to flip the isLoading flag on the message
      setAllConversations(prev => {
        const finalMessages = (prev[activeUrlGroupId] || []).map(msg =>
          msg.id === modelMessageId ? { ...msg, isLoading: false } : msg
        );
        return { ...prev, [activeUrlGroupId]: finalMessages };
      });
    }
  };

  const handleClearConversation = () => {
    if (!activeUrlGroupId) return;
    setAllConversations(prev => {
      const newConversations = { ...prev };
      delete newConversations[activeUrlGroupId];
      return newConversations;
    });
    // Re-fetch suggestions for the now-empty chat
    fetchSuggestions();
  };

  return (
    <div className={`flex h-screen bg-[#F9F9F9] dark:bg-[#1E1F22] text-gray-900 dark:text-[#EAECEF] font-sans transition-colors duration-300 overflow-hidden`}>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 w-80 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <KnowledgeBaseManager
          urlGroups={urlGroups}
          setUrlGroups={setUrlGroups}
          activeUrlGroupId={activeUrlGroupId}
          setActiveUrlGroupId={setActiveUrlGroupId}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 flex flex-col h-screen">
        <header className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open knowledge base"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold">Contextual Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* <LanguageSwitcher /> */}
            <ThemeSwitcher theme={theme} onToggleTheme={handleToggleTheme} />
          </div>
        </header>
        <ChatInterface
          messages={currentMessages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          initialSuggestions={initialSuggestions}
          onClearConversation={handleClearConversation}
        />
      </main>
    </div>
  );
};

export default App;