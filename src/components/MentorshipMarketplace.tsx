import { useEffect, useMemo, useState } from 'react';
import { Clock, Sparkles, UserCheck, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/hooks/useTrades';
import { useXP } from '@/contexts/XPContext';
import { useDisciplineScore } from '@/hooks/useDisciplineScore';

type MentorReview = {
  tradeId: string;
  mentorName: string;
  comment: string;
  createdAt: string;
};

const REVIEW_COST = 150;
const REVIEW_TEMPLATES = [
  'You entered too late here. Define the trigger and stick to it.',
  'Solid thesis, but size was aggressive for the setup.',
  'Nice patience on the entry. Consider tighter risk on the exit.',
  'Your stop loss was too wide. Tighten it to protect capital.',
];

const mentorRoster = [
  { id: 'mentor-ava', name: 'Ava Patel', discipline: 96 },
  { id: 'mentor-jay', name: 'Jay Coleman', discipline: 94 },
  { id: 'mentor-lena', name: 'Lena Ortiz', discipline: 92 },
];

const getReviewsKey = (userId: string) => `teenvest.mentorReviews.${userId}`;

const readReviews = (userId: string): Record<string, MentorReview> => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(getReviewsKey(userId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, MentorReview>;
  } catch (error) {
    console.warn('Failed to parse mentor reviews:', error);
    return {};
  }
};

const writeReviews = (userId: string, reviews: Record<string, MentorReview>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getReviewsKey(userId), JSON.stringify(reviews));
};

const MentorshipMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: trades } = useTrades();
  const { xp, addXP } = useXP();
  const { score } = useDisciplineScore();
  const [selectedMentor, setSelectedMentor] = useState(mentorRoster[0].id);
  const [reviews, setReviews] = useState<Record<string, MentorReview>>(() =>
    user ? readReviews(user.id) : {}
  );

  const { data: profile } = useQuery({
    queryKey: ['mentor-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as { created_at: string } | null;
    },
    enabled: !!user,
  });

  const monthsActive = useMemo(() => {
    if (!profile?.created_at) return 0;
    const ms = Date.now() - new Date(profile.created_at).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
  }, [profile?.created_at]);

  const isEligibleMentor = score >= 90 && monthsActive >= 6;
  const activeMentor = mentorRoster.find((mentor) => mentor.id === selectedMentor) || mentorRoster[0];

  const recentTrades = useMemo(() => {
    return (trades || [])
      .filter((trade) => trade.status === 'completed')
      .slice(0, 3);
  }, [trades]);

  useEffect(() => {
    if (!user) return;
    setReviews(readReviews(user.id));
  }, [user?.id]);

  const handleRequestReview = async (tradeId: string) => {
    if (!user) return;
    if (xp < REVIEW_COST) {
      toast({
        title: 'Not enough XP',
        description: `You need ${REVIEW_COST} XP to request a review.`,
        variant: 'destructive',
      });
      return;
    }

    await addXP(-REVIEW_COST);
    const comment = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
    const newReview: MentorReview = {
      tradeId,
      mentorName: activeMentor.name,
      comment,
      createdAt: new Date().toISOString(),
    };

    const updated = { ...reviews, [tradeId]: newReview };
    setReviews(updated);
    writeReviews(user.id, updated);

    toast({
      title: 'Mentor review delivered',
      description: `${activeMentor.name} left feedback on your trade.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Mentorship Marketplace
        </CardTitle>
        <CardDescription>Get trade journal feedback from top performers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-secondary/50 p-3 flex items-center justify-between text-sm">
          <div>
            <div className="font-medium">Mentor eligibility</div>
            <div className="text-xs text-muted-foreground">
              Discipline score 90+ · 6+ months active
            </div>
          </div>
          <div className="text-right">
            <Badge variant={isEligibleMentor ? 'default' : 'outline'}>
              {isEligibleMentor ? 'Eligible' : 'Not yet'}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">
              {monthsActive} months · {score}/100 discipline
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Choose a mentor</div>
          <Select value={selectedMentor} onValueChange={setSelectedMentor}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mentorRoster.map((mentor) => (
                <SelectItem key={mentor.id} value={mentor.id}>
                  {mentor.name} · {mentor.discipline} discipline
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            Reviews cost {REVIEW_COST} XP. Mentors earn Top Contributor badges and profile borders.
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Request trade reviews</div>
          {recentTrades.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Make a few trades to request mentor feedback on your journal.
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((trade) => {
                const review = reviews[trade.id];
                return (
                  <div key={trade.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {trade.symbol} · {trade.trade_type.toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(trade.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestReview(trade.id)}
                        disabled={!!review}
                      >
                        {review ? 'Reviewed' : 'Request review'}
                      </Button>
                    </div>
                    {review && (
                      <div className="mt-3 rounded-lg border bg-secondary/40 p-3 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-3 h-3" />
                          <span className="font-semibold">{review.mentorName}</span>
                        </div>
                        <p>{review.comment}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isEligibleMentor ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5" />
            You qualify to mentor. Enable availability to earn XP from mentees.
          </div>
        ) : (
          <div className="rounded-lg border border-muted p-3 text-xs text-muted-foreground">
            Reach 90+ discipline and 6 months of activity to unlock mentor earnings.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MentorshipMarketplace;
