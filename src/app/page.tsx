"use client";
import React, { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { Menu, X, Send, User, Bot, Globe } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { href: "https://optimove.bamboohr.com/login.php?r=%2Fhome", label: "HR Platform" },
    { href: "https://servicedesk.optimove.com/login?redirectTo=%2F", label: "IT Services" },
    { href: "https://www.notion.so/Optimove-26f2f6dd1232425a8922156b0459a1ba", label: "Documentation" },
    { href: "https://github.com/graphyteai", label: "Github" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 p-4 sm:p-6 backdrop-blur-md bg-white/10 dark:bg-gray-900/10 transition-colors duration-300">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-shrink-0">
          <svg aria-label="Optimove" width="180" height="36" viewBox="0 0 180 36">
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              className="text-[28px] font-bold fill-gray-900 dark:fill-gray-100"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              Optimove
            </text>
          </svg>
        </div>

        <nav className="hidden md:flex space-x-6 lg:space-x-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300 font-medium">
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

      <div className={`md:hidden mt-4 transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <nav className="flex flex-col items-center space-y-2 bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg shadow-lg">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium w-full text-center py-2 rounded-lg">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
};


type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Gemini API Call to get suggested replies ---
  const fetchSuggestedReplies = async (aiMessageText: string) => {
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const prompt = `Based on this AI response: "${aiMessageText}", suggest three distinct and concise follow-up questions or replies for the user. Keep them very short, like tweet-length.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            replies: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
        }
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        const jsonText = candidate.content.parts[0].text;
        const parsedJson = JSON.parse(jsonText);
        if (parsedJson.replies && Array.isArray(parsedJson.replies)) {
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

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setSuggestedReplies([]);

    // --- Gemini API Call for Chat Response ---
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const history = updatedMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    })).slice(0, -1); // Exclude the last user message from history for the payload

    const payload = {
      contents: [
        ...history,
        { role: "user", parts: [{ text: textToSend }] }
      ],
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

      const result = await response.json();
      const candidate = result.candidates?.[0];

      let aiText = "Sorry, I couldn't generate a response. Please try again.";
      if (candidate && candidate.content?.parts?.[0]?.text) {
        aiText = candidate.content.parts[0].text;
      }

      const aiResponse: Message = { id: Date.now() + 1, text: aiText, sender: 'ai' };
      setMessages(prev => [...prev, aiResponse]);

      await fetchSuggestedReplies(aiText);

    } catch (error) {
      console.error("Gemini API call failed:", error);
      const errorResponse: Message = { id: Date.now() + 1, text: "Oops! Something went wrong connecting to the AI. Please check the console for details.", sender: 'ai' };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="font-sans min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header />
      <main className="flex-1 flex flex-col w-full relative pt-20 sm:pt-24">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100 via-transparent to-purple-100 dark:from-blue-900/30 dark:via-transparent dark:to-purple-900/30 -z-10"></div>

        <div ref={chatContainerRef} className={`flex-1 overflow-y-auto transition-opacity duration-500 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
            {messages.map((msg, index) => (
              <React.Fragment key={msg.id}>
                <div className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'ai' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Bot size={20} className="text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl max-w-md md:max-w-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 shadow-sm rounded-bl-none'}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User size={20} className="text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                </div>
                {msg.sender === 'ai' && index === messages.length - 1 && suggestedReplies.length > 0 && !isLoading && (
                  <div className="flex justify-start ml-11 mt-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-1">✨</span>
                      {suggestedReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(reply)}
                          className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Bot size={20} className="text-gray-600 dark:text-gray-300" />
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></span>
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
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200">Optimove</h1>
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
            <form onSubmit={handleFormSubmit} className="relative flex items-center bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Message your AI assistant..."
                className="w-full bg-transparent pl-6 pr-14 py-3 rounded-full focus:outline-none resize-none max-h-40 overflow-y-auto"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e);
                  }
                }}
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        <footer className={`py-6 px-4 transition-opacity duration-700 ${!hasStarted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="container mx-auto flex items-center justify-center">
            <a className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-gray-600 dark:text-gray-400" href="https://optimove.com" target="_blank" rel="noopener noreferrer">
              <Globe size={16} />
              Go to optimove.com
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}



