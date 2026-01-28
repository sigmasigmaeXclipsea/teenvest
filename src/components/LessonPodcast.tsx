import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, Loader2, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LessonPodcastProps {
  moduleId: string;
  title: string;
  content: string;
}

const LessonPodcast = ({ moduleId, title, content }: LessonPodcastProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [podcastScript, setPodcastScript] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  // Generate podcast script using Lovable AI edge function
  const stripMarkdown = (text: string) => {
    return text
      .replace(/\*\*/g, '')
      .replace(/^- /gm, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const buildFallbackScript = () => {
    const cleaned = stripMarkdown(content);
    const snippet = cleaned.slice(0, 700);
    return `Welcome to the TeenVest lesson podcast on ${title}. ${snippet} This wraps up your quick audio recap.`;
  };

  const generatePodcast = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('learning-ai', {
        body: {
          prompt: `Convert this lesson into an engaging podcast script. Make it conversational, easy to understand, and suitable for audio narration. Keep it under 500 words.

Title: ${title}
Content: ${content}

Return the script in a conversational podcast format with natural speaking patterns.`,
          context: 'podcast_generation'
        }
      });

      if (error) throw error;

      const script = data?.response || '';
      const nextScript = script || buildFallbackScript();
      setPodcastScript(nextScript);

      // Use text-to-speech in the browser
      speakText(nextScript);
    } catch (error: any) {
      const fallbackScript = buildFallbackScript();
      setPodcastScript(fallbackScript);
      speakText(fallbackScript);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate podcast, using local recap',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Text-to-speech using browser's Web Speech API
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      utterance.rate = 0.9; // Slightly slower for learning
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Get a female voice for more engaging narration
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Karen'));
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onpause = () => setIsPlaying(false);
      utterance.onresume = () => setIsPlaying(true);
      utterance.onerror = () => {
        setIsPlaying(false);
        toast({
          title: 'Error',
          description: 'Failed to play audio',
          variant: 'destructive',
        });
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support text-to-speech',
        variant: 'destructive',
      });
    }
  };

  const togglePlayPause = () => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support text-to-speech',
        variant: 'destructive',
      });
      return;
    }

    if (!podcastScript) {
      generatePodcast();
      return;
    }

    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setIsPlaying(false);
      return;
    }
    if (synth.paused) {
      synth.resume();
      setIsPlaying(true);
      return;
    }
    speakText(podcastScript);
  };

  const stopPodcast = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Load voices on component mount
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    handleVoicesChanged();
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      window.speechSynthesis.cancel();
    };
  }, [moduleId]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Lesson Podcast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <Button
              onClick={togglePlayPause}
              disabled={isLoading}
              size="lg"
              className="flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            
            <div className="flex-1">
              <p className="font-medium text-sm">
                {isLoading ? 'Generating podcast...' : isPlaying ? 'Playing...' : 'Listen to this lesson'}
              </p>
              <p className="text-xs text-muted-foreground">
                AI-narrated summary of the lesson content
              </p>
            </div>
            
            <Volume2 className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {podcastScript && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Podcast Script</p>
              <Button variant="outline" size="sm" onClick={stopPodcast}>
                Stop
              </Button>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {podcastScript}
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          💡 Tip: Use headphones for the best experience
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonPodcast;
