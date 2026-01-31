import { useState } from 'react';
import { PlayCircle, Clock, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type LessonVideoBlockProps = {
  title: string;
  description?: string;
  videoUrl?: string;
  posterUrl?: string;
  durationSeconds?: number;
  transcript?: string;
  onComplete?: () => void;
};

const LessonVideoBlock = ({
  title,
  description,
  videoUrl,
  posterUrl,
  durationSeconds = 60,
  transcript,
  onComplete,
}: LessonVideoBlockProps) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const durationLabel = `${Math.max(15, Math.round(durationSeconds))}s`;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {durationLabel}
          </Badge>
          <span>Passive walkthrough</span>
        </div>

        {videoUrl ? (
          <div className="overflow-hidden rounded-lg border bg-black/5">
            <video
              className="w-full"
              controls
              poster={posterUrl}
              onEnded={() => {
                setHasEnded(true);
                onComplete?.();
              }}
            >
              <source src={videoUrl} />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-secondary/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <PlayCircle className="w-4 h-4 text-primary" />
              60-second animation coming soon
            </div>
            <p className="mt-2">
              Use the transcript below for the quick walkthrough until the video is added.
            </p>
          </div>
        )}

        {transcript && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTranscript((prev) => !prev)}
            >
              {showTranscript ? 'Hide transcript' : 'Show transcript'}
            </Button>
            {showTranscript && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                {transcript}
              </div>
            )}
          </div>
        )}

        {!videoUrl && onComplete && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (hasEnded) return;
              setHasEnded(true);
              onComplete();
            }}
          >
            Mark as watched
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonVideoBlock;
