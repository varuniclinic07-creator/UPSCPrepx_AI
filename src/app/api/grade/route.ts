import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { gradeAnswer, saveGradingResult, getGradingHistory } from '@/lib/grading/grader-service';
import { errors } from '@/lib/security/error-sanitizer';

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const { question, answer, save } = await request.json();

        if (!question || !answer) {
            return errors.validation([
                { field: 'question', message: 'Question is required' },
                { field: 'answer', message: 'Answer is required' }
            ]);
        }

        // Validate input length to prevent abuse
        if (question.length > 5000 || answer.length > 10000) {
            return errors.validation([{ field: 'content', message: 'Content too long' }]);
        }

        const result = await gradeAnswer(question, answer);

        if (save) {
            await saveGradingResult((session as any).user.id, question, answer, result);
        }

        return NextResponse.json({ result });

    } catch (error) {
        console.error('[API] Grade error:', error);
        return errors.internal(error);
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession();
        const history = await getGradingHistory((session as any).user.id);
        return NextResponse.json({ history });

    } catch (error) {
        console.error('[API] Grade history error:', error);
        return errors.internal(error);
    }
}
