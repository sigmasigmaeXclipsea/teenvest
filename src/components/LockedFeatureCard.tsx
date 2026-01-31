import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type LockedFeatureCardProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const LockedFeatureCard = ({
  title,
  description,
  ctaLabel = 'Open Skill Tree',
  ctaHref = '/learn',
}: LockedFeatureCardProps) => (
  <Card className="border-dashed">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Lock className="w-5 h-5 text-muted-foreground" />
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Link to={ctaHref}>
        <Button variant="outline">{ctaLabel}</Button>
      </Link>
    </CardContent>
  </Card>
);

export default LockedFeatureCard;
