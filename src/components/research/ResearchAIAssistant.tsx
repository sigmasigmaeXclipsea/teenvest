import { useState } from 'react';
import { Brain, Send, Loader2, Sparkles, TrendingUp, Shield, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResearchAIAssistantProps {
  symbol: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ResearchAIAssistant = ({ symbol }: ResearchAIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQuestions = [
    `What are the key risks for ${symbol}?`,
    `Is ${symbol} a good long-term investment?`,
    `How does ${symbol} compare to its competitors?`,
    `What's the growth outlook for ${symbol}?`,
    `Explain ${symbol}'s business model`,
    `What are ${symbol}'s competitive advantages?`
  ];

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build messages array with context
      const systemContext = `You are a professional stock research analyst assistant. The user is researching ${symbol}. Provide accurate, educational, and balanced analysis. Always remind users this is for educational purposes and not financial advice.`;
      
      const chatMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: messageText }
      ];

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: chatMessages,
          context: systemContext
        }
      });

      if (error) throw error;

      // Handle streaming response
      if (data instanceof ReadableStream) {
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
          
          for (const line of lines) {
            const jsonStr = line.replace('data: ', '');
            if (jsonStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content || '';
              fullContent += content;
            } catch {
              // Skip malformed JSON
            }
          }
        }

        const assistantMessage = { 
          role: 'assistant' as const, 
          content: fullContent || 'I apologize, but I was unable to process your request. Please try again.'
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle non-streaming response
        const assistantMessage = { 
          role: 'assistant' as const, 
          content: data?.reply || data?.choices?.[0]?.message?.content || 'I apologize, but I was unable to process your request.'
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      {messages.length === 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              AI Research Assistant
            </CardTitle>
            <CardDescription>
              Ask anything about {symbol} - from financials to competitive analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Growth Analysis</p>
                  <p className="text-xs text-muted-foreground">Revenue trends, market expansion, future outlook</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Risk Assessment</p>
                  <p className="text-xs text-muted-foreground">Competitive threats, market risks, challenges</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                <Target className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Valuation Insights</p>
                  <p className="text-xs text-muted-foreground">Fair value analysis, peer comparison</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Suggested Questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => sendMessage(question)}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-primary" />
              Research Chat - {symbol}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4" />
                        <span className="text-xs font-medium">AI Analyst</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            {messages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestedQuestions.slice(0, 3).map((q, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Input Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Textarea
              placeholder={`Ask anything about ${symbol}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
            <Button 
              onClick={() => sendMessage(input)} 
              disabled={!input.trim() || isLoading}
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ⚠️ For educational purposes only. Not financial advice. Always do your own research.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchAIAssistant;