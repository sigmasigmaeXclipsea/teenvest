import { useState, useEffect } from 'react';
import { Building2, Users, MapPin, Globe, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ResearchCompanyProfileProps {
  symbol: string;
}

interface CompanyProfile {
  symbol: string;
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  ceo: string;
  employees: number;
  headquarters: string;
  website: string;
  founded: string;
}

const ResearchCompanyProfile = ({ symbol }: ResearchCompanyProfileProps) => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulated company profile data (would come from API in production)
    const mockProfiles: Record<string, CompanyProfile> = {
      AAPL: {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, and wearables, home and accessories. It also provides AppleCare support and cloud services, and operates various platforms including App Store, Apple Music, Apple TV+, and Apple Arcade.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        ceo: 'Tim Cook',
        employees: 164000,
        headquarters: 'Cupertino, California',
        website: 'www.apple.com',
        founded: '1976'
      },
      MSFT: {
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates in three segments: Productivity and Business Processes, Intelligent Cloud, and More Personal Computing. It offers Office 365, LinkedIn, Azure, Windows, Xbox, and Surface devices.',
        sector: 'Technology',
        industry: 'Software - Infrastructure',
        ceo: 'Satya Nadella',
        employees: 221000,
        headquarters: 'Redmond, Washington',
        website: 'www.microsoft.com',
        founded: '1975'
      },
      GOOGL: {
        symbol: 'GOOGL',
        companyName: 'Alphabet Inc.',
        description: 'Alphabet Inc. provides various products and platforms worldwide. It operates through Google Services, Google Cloud, and Other Bets segments. The company offers products like Search, YouTube, Gmail, Google Maps, Chrome, Android, Google Play, and various hardware devices.',
        sector: 'Technology',
        industry: 'Internet Content & Information',
        ceo: 'Sundar Pichai',
        employees: 186000,
        headquarters: 'Mountain View, California',
        website: 'www.abc.xyz',
        founded: '2015 (Google: 1998)'
      },
      TSLA: {
        symbol: 'TSLA',
        companyName: 'Tesla, Inc.',
        description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems worldwide. The company operates through Automotive and Energy Generation and Storage segments. It offers electric vehicles, solar panels, and energy storage products.',
        sector: 'Consumer Discretionary',
        industry: 'Automobiles',
        ceo: 'Elon Musk',
        employees: 140000,
        headquarters: 'Austin, Texas',
        website: 'www.tesla.com',
        founded: '2003'
      },
      AMZN: {
        symbol: 'AMZN',
        companyName: 'Amazon.com, Inc.',
        description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores worldwide. It operates through North America, International, and AWS segments. The company also provides AWS, advertising services, and digital content.',
        sector: 'Consumer Discretionary',
        industry: 'Internet & Direct Marketing Retail',
        ceo: 'Andy Jassy',
        employees: 1540000,
        headquarters: 'Seattle, Washington',
        website: 'www.amazon.com',
        founded: '1994'
      }
    };

    setIsLoading(true);
    setTimeout(() => {
      setProfile(mockProfiles[symbol] || {
        symbol,
        companyName: symbol,
        description: 'Company profile information is being fetched. This stock is part of a major exchange and comprehensive data will be available soon.',
        sector: 'Various',
        industry: 'Various',
        ceo: 'Information pending',
        employees: 0,
        headquarters: 'United States',
        website: '',
        founded: ''
      });
      setIsLoading(false);
    }, 500);
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
        <Card><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        <Card><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Company Description */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            About {profile.companyName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{profile.description}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary">{profile.sector}</Badge>
            <Badge variant="outline">{profile.industry}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key People & Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leadership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{profile.ceo}</p>
              <p className="text-sm text-muted-foreground">Chief Executive Officer</p>
            </div>
          </div>
          
          {profile.employees > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{profile.employees.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Employees</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{profile.headquarters}</p>
              <p className="text-sm text-muted-foreground">Headquarters</p>
            </div>
          </div>

          {profile.founded && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{profile.founded}</p>
                <p className="text-sm text-muted-foreground">Founded</p>
              </div>
            </div>
          )}

          {profile.website && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Globe className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  {profile.website}
                </a>
                <p className="text-sm text-muted-foreground">Website</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchCompanyProfile;