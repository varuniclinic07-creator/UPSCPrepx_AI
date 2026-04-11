'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  questions: Question[];
  timeLimit?: number;
}

interface QuizPageProps {
  params: { id: string };
}

export default function QuizTakePage({ params }: QuizPageProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [params.id]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResults]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quiz/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quiz');
      }

      setQuiz(data.quiz);
      setSelectedAnswers(new Array(data.quiz.questions.length).fill(null));
      setTimeLeft((data.quiz.timeLimit || data.quiz.questions.length * 2) * 60);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResults) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/quiz/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: selectedAnswers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      setShowResults(true);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    
    return {
      correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground mb-2">Quiz not found</h2>
        <Button asChild>
          <Link href="/dashboard/quiz">Back to Quizzes</Link>
        </Button>
      </div>
    );
  }

  const score = calculateScore();
  const question = quiz.questions[currentQuestion];

  if (showResults) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Results Header */}
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Quiz Complete!</h1>
            <p className="text-muted-foreground mb-6">{quiz.title}</p>
            
            <div className="text-6xl font-bold text-gradient mb-2">
              {score.percentage}%
            </div>
            <p className="text-lg text-muted-foreground">
              {score.correct} out of {score.total} correct
            </p>

            <div className="flex justify-center gap-4 mt-8">
              <Button variant="outline" asChild>
                <Link href="/dashboard/quiz">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Quizzes
                </Link>
              </Button>
              <Button variant="gradient" onClick={() => {
                setShowResults(false);
                setCurrentQuestion(0);
                setSelectedAnswers(new Array(quiz.questions.length).fill(null));
                setTimeLeft((quiz.timeLimit || quiz.questions.length * 2) * 60);
              }}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Review Questions */}
        <h2 className="text-xl font-semibold text-foreground">Review Answers</h2>
        
        {quiz.questions.map((q, index) => {
          const isCorrect = selectedAnswers[index] === q.correctAnswer;
          const userAnswer = selectedAnswers[index];
          
          return (
            <Card key={q.id || index} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </span>
                  <CardTitle className="text-base font-medium">
                    Q{index + 1}. {q.question}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {q.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={`p-3 rounded-lg border ${
                      optIndex === q.correctAnswer
                        ? 'border-green-500 bg-green-500/10'
                        : optIndex === userAnswer && userAnswer !== q.correctAnswer
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-border'
                    }`}
                  >
                    <span className="text-sm">
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </span>
                    {optIndex === q.correctAnswer && (
                      <span className="ml-2 text-xs text-green-500">(Correct)</span>
                    )}
                    {optIndex === userAnswer && userAnswer !== q.correctAnswer && (
                      <span className="ml-2 text-xs text-red-500">(Your answer)</span>
                    )}
                  </div>
                ))}
                
                {q.explanation && (
                  <div className="mt-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-sm font-medium text-blue-500 mb-1">Explanation:</p>
                    <p className="text-sm text-muted-foreground">{q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/quiz">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">{quiz.subject}</p>
          </div>
        </div>
        
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            timeLeft < 60 ? 'bg-red-500/10 text-red-500' : 'bg-accent text-foreground'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <span>{selectedAnswers.filter(a => a !== null).length} answered</span>
        </div>
        <div className="h-2 bg-accent rounded-full overflow-hidden">
          <div 
            className="h-full gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium leading-relaxed">
            {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                selectedAnswers[currentQuestion] === index
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="font-medium mr-3">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentQuestion === quiz.questions.length - 1 ? (
          <Button
            variant="gradient"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Submit Quiz
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Question Navigator */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3">Jump to question:</p>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${
                  currentQuestion === index
                    ? 'border-primary bg-primary text-primary-foreground'
                    : selectedAnswers[index] !== null
                    ? 'border-green-500 bg-green-500/10 text-green-500'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}