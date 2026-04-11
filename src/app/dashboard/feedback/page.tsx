'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Star } from 'lucide-react';

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Feedback</h1>
      <p className="text-muted-foreground mb-8">Help us improve your UPSC prep experience.</p>

      {submitted ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
          <p className="text-muted-foreground mb-4">Your feedback has been submitted.</p>
          <button onClick={() => { setSubmitted(false); setMessage(''); setRating(0); }} className="text-sm text-primary hover:underline">
            Submit another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium block mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-6 w-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Category</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option>General</option>
              <option>Bug Report</option>
              <option>Feature Request</option>
              <option>Content Quality</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Your feedback</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Tell us what you think..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              required
            />
          </div>

          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Send className="h-4 w-4" /> Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
}
