import { notFound } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering to avoid static generation errors
export const dynamic = 'force-dynamic';
import { ArrowLeft, Tag, Calendar, Eye, Lightbulb, Link2, BookOpen, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentAffairById } from '@/lib/services/current-affairs-service';

interface CurrentAffairPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CurrentAffairPageProps) {
  const { id } = await params;
  const affair = await getCurrentAffairById(id);
  return {
    title: affair?.topic || 'Article Not Found',
  };
}

export default async function CurrentAffairPage({ params }: CurrentAffairPageProps) {
  const { id } = await params;
  const affair = await getCurrentAffairById(id);

  if (!affair) {
    notFound();
  }

  const { content } = affair;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href="/dashboard/current-affairs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{affair.topic}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {affair.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(affair.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {affair.viewCount} views
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {content.summary && (
        <Card className="glass-card border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <p className="text-lg text-foreground leading-relaxed">{content.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {content.details && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Detailed Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose-upsc whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {content.details}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Points */}
      {content.keyPoints && content.keyPoints.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Key Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {content.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* UPSC Relevance */}
      {content.upscRelevance && (
        <Card className="glass-card bg-green-500/5 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <FileText className="w-5 h-5" />
              UPSC Relevance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{content.upscRelevance}</p>
          </CardContent>
        </Card>
      )}

      {/* PYQ Connections */}
      {content.pyqConnections && content.pyqConnections.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Previous Year Question Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.pyqConnections.map((pyq, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-muted-foreground">{pyq}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Related Topics */}
      {content.relatedTopics && content.relatedTopics.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-500" />
              Related Topics to Study
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {content.relatedTopics.map((topic, index) => (
                <Link
                  key={index}
                  href={`/notes/new?topic=${encodeURIComponent(topic)}`}
                  className="px-3 py-1.5 text-sm rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
                >
                  {topic}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {content.sources && content.sources.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">📚 Sources & Further Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {content.sources.map((source, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {source}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/current-affairs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Current Affairs
          </Link>
        </Button>
        <Button variant="gradient" asChild>
          <Link href={`/quiz/new?topic=${encodeURIComponent(affair.topic)}&subject=Current Affairs`}>
            Take Quiz on This Topic
          </Link>
        </Button>
      </div>
    </div>
  );
}