import { notFound } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering to avoid static generation errors
export const dynamic = 'force-dynamic';
import { ArrowLeft, Tag, Clock, BookOpen, Lightbulb, FileText, Link2, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getNoteById } from '@/lib/services/notes-service';

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NotePageProps) {
  const { id } = await params;
  const note = await getNoteById(id);
  return {
    title: note?.title || 'Note Not Found',
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;
  const note = await getNoteById(id);

  if (!note) {
    notFound();
  }

  const { content } = note;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href="/dashboard/notes">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{note.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {note.subject}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(note.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
        <Button variant="gradient" asChild>
          <Link href={`/quiz/new?topic=${encodeURIComponent(note.title)}&subject=${encodeURIComponent(note.subject)}`}>
            <Brain className="w-4 h-4 mr-2" />
            Take Quiz
          </Link>
        </Button>
      </div>

      {/* Summary */}
      {content.summary && (
        <Card className="glass-card border-l-4 border-l-primary">
          <CardContent className="p-6">
            <p className="text-lg text-foreground leading-relaxed">{content.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Detailed Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose-upsc">
            {content.sections?.map((section, index) => (
              <div key={index} className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">{section.title}</h3>
                <div className="text-muted-foreground whitespace-pre-wrap">{section.content}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Points */}
      {content.keyPoints && content.keyPoints.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Key Points for Revision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {content.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
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
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              UPSC Relevance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{content.upscRelevance}</p>
          </CardContent>
        </Card>
      )}

      {/* Mnemonics */}
      {content.mnemonics && content.mnemonics.length > 0 && (
        <Card className="glass-card bg-purple-500/5 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Brain className="w-5 h-5" />
              Memory Tricks & Mnemonics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.mnemonics.map((mnemonic, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-500">💡</span>
                  <span className="text-foreground">{mnemonic}</span>
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
              <Link2 className="w-5 h-5 text-orange-500" />
              Related Topics to Explore
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
            <CardTitle className="text-lg">📚 Standard Sources</CardTitle>
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
    </div>
  );
}