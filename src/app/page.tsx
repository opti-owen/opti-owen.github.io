"use client";
import React, { useState, useRef, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { Menu, X, Send, User, Bot, Globe, KeyRound } from 'lucide-react';

// Reusable Header Component
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { href: "https://optimove.bamboohr.com/login.php?r=%2Fhome", label: "HR Platform" },
    { href: "https://servicedesk.optimove.com/login?redirectTo=%2F", label: "IT Services" },
    { href: "https://www.notion.so/Optimove-26f2f6dd1232425a8922156b0459a1ba", label: "Documentation" },
    { href: "https://github.com/graphyteai", label: "Github" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 p-4 sm:p-6 backdrop-blur-md bg-white/10 dark:bg-gray-900/10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-shrink-0 font-bold text-2xl text-gray-900 dark:text-gray-100">
          Optimove
        </div>
        <nav className="hidden md:flex space-x-6 lg:space-x-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-gray-900 dark:text-white focus:outline-none">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden mt-4">
          <nav className="flex flex-col items-center space-y-2 bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg shadow-lg">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 w-full text-center py-2 rounded-lg">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

// Type Definitions
type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
};

type Role = 'user' | 'model';

type HistoryItem = {
  role: Role;
  parts: { text: string }[];
}

// API Service Hook
const useChatApi = (apiKey: string | null) => {
  const callApi = useCallback(async (messages: HistoryItem[], action: 'chat' | 'get_suggestions' = 'chat') => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, apiKey, action }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    return response.json();
  }, [apiKey]);

  return { callApi };
};


// Main Component
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { callApi } = useChatApi(apiKey);

  useEffect(() => {
    // Check if the API key is needed on mount
    const checkApiKey = async () => {
      try {
        await callApi([]); // A test call to see if the server has a key
      } catch (error) {
        setShowApiKeyModal(true);
      }
    };
    checkApiKey();
  }, [callApi]);


  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const fetchSuggestedReplies = async (aiMessageText: string) => {
    try {
      const result = await callApi([{ role: 'model', parts: [{ text: aiMessageText }] }], 'get_suggestions');
      const candidate = result.candidates?.[0];
      if (candidate?.content?.parts?.[0]?.text) {
        const jsonText = candidate.content.parts[0].text;
        const parsedJson = JSON.parse(jsonText);
        if (parsedJson.replies?.length) {
          setSuggestedReplies(parsedJson.replies.slice(0, 3));
        }
      }
    } catch (error) {
      console.error("Failed to fetch suggested replies:", error);
      setSuggestedReplies([]);
    }
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    if (!hasStarted) setHasStarted(true);

    const userMessage: Message = { id: Date.now(), text: textToSend, sender: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setSuggestedReplies([]);

    const history: HistoryItem[] = newMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    try {
      const result = await callApi(history);
      const candidate = result.candidates?.[0];
      const aiText = candidate?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response.";
      const aiResponse: Message = { id: Date.now() + 1, text: aiText, sender: 'ai' };
      setMessages(prev => [...prev, aiResponse]);
      await fetchSuggestedReplies(aiText);
    } catch (error: any) {
      console.error("API call failed:", error);
      const errorText = error.message.includes('API key is not configured')
        ? "The API key is missing or invalid. Please provide a valid key."
        : "Oops! Something went wrong. Please check the console.";
      if (error.message.includes('API key is not configured')) setShowApiKeyModal(true);
      const errorResponse: Message = { id: Date.now() + 1, text: errorText, sender: 'ai' };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleApiKeySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey);
      setShowApiKeyModal(false);
      // Optional: Send a welcome message or retry last message
      if (messages.length === 0) {
        setMessages([{ id: Date.now(), text: "API Key set! How can I help you?", sender: 'ai' }]);
      }
    }
  };

  const ApiKeyModal = () => (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md text-center">
        <KeyRound size={48} className="mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Enter API Key</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          The server is not configured with a Generic API key. Please provide one to continue.
        </p>
        <form onSubmit={handleApiKeySubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            placeholder="Enter your Generic API Key"
            className="w-full bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="w-full p-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors">
            Save and Continue
          </button>
        </form>
      </div>
    </div>
  );


  return (
    <div className="font-sans min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {showApiKeyModal && <ApiKeyModal />}
      <Header />
      <main className="flex-1 flex flex-col w-full relative pt-20 sm:pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-purple-100/50 dark:from-blue-900/20 dark:via-transparent dark:to-purple-900/20 -z-10"></div>
        <div ref={chatContainerRef} className={`flex-1 overflow-y-auto p-4 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="container mx-auto max-w-3xl space-y-4">
            {messages.map((msg, index) => (
              <div key={msg.id}>
                <div className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0"><Bot size={20} /></div>}
                  <div className={`p-3 rounded-2xl max-w-md md:max-w-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 shadow-sm rounded-bl-none'}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0"><User size={20} /></div>}
                </div>
                {msg.sender === 'ai' && index === messages.length - 1 && suggestedReplies.length > 0 && !isLoading && (
                  <div className="flex justify-start ml-11 mt-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">✨</span>
                      {suggestedReplies.map((reply, i) => (
                        <button key={i} onClick={() => sendMessage(reply)} className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0"><Bot size={20} /></div>
                <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    {[75, 150, 300].map(delay => <span key={delay} className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${delay}ms` }}></span>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`w-full transition-all duration-700 ease-in-out ${hasStarted ? 'sticky bottom-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm py-4' : 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}`}>
          <div className="container mx-auto max-w-3xl px-4">
            {!hasStarted && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-3xl sm:text-4xl font-bold">Opti</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">How can I help you today?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <button onClick={() => sendMessage('Summarize our latest company-wide email')} className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg text-left hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm">
                    <p className="font-semibold">Summarize an Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get key points from the latest update.</p>
                  </button>
                  <button onClick={() => sendMessage('Draft a thank you note to a colleague')} className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg text-left hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm">
                    <p className="font-semibold">Draft a Thank You Note</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Show appreciation for a team member.</p>
                  </button>
                </div>
              </>
            )}
            <form onSubmit={handleFormSubmit} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message your AI assistant..."
                className="w-full bg-white dark:bg-gray-800 pl-6 pr-14 py-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none resize-none max-h-40"
                rows={1}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(e); } }}
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
        <footer className={`py-6 px-4 text-center transition-opacity duration-700 ${!hasStarted ? 'opacity-100' : 'opacity-0'}`}>
          <a className="inline-flex items-center gap-2 hover:underline text-gray-600 dark:text-gray-400" href="https://optimove.com" target="_blank" rel="noopener noreferrer">
            <Globe size={16} />
            Go to Optimove.com
          </a>
        </footer>
      </main>
    </div>
  );
}

