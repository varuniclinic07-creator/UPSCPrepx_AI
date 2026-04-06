/**
 * AI Study Schedule Generator Service
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - AI-powered schedule generation
 * - 9Router → Groq → Ollama fallback
 * - Bilingual output (EN+HI)
 * - Simplified language (10th grade level)
 */

import { createClient } from '@supabase/supabase-js';
import { generateAIResponse } from '../ai/ai-provider';

// ============================================================================
// TYPES
// ============================================================================

interface StudyPlanInput {
  userId: string;
  examDate: string;
  dailyStudyHours: number;
  subjects: string[];
  optionalSubject?: string;
  currentLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface StudyTask {
  taskType: 'study' | 'revision' | 'mock_test' | 'analysis' | 'current_affairs';
  subject: string;
  topic: string;
  subtopic?: string;
  estimatedMinutes: number;
  contentLinks?: string[];
  aiGenerated: boolean;
}

interface DaySchedule {
  date: string;
  dayNumber: number;
  tasks: StudyTask[];
  totalMinutes: number;
  status: 'pending' | 'in-progress' | 'completed' | 'missed';
}

interface GeneratedSchedule {
  planId: string;
  totalDays: number;
  totalTasks: number;
  days: DaySchedule[];
  milestones: {
    type: string;
    targetValue: number;
    unit: string;
    title: { en: string; hi: string };
    estimatedDate: string;
  }[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GS_SYLLABUS = {
  GS1: [
    'Indian Heritage and Culture',
    'History of the World',
    'Geography of India and World',
    'Indian Society',
  ],
  GS2: [
    'Indian Constitution',
    'Polity and Governance',
    'International Relations',
    'Social Justice',
  ],
  GS3: [
    'Economy',
    'Science and Technology',
    'Environment and Ecology',
    'Security and Disaster Management',
  ],
  GS4: [
    'Ethics and Human Interface',
    'Attitude and Emotional Intelligence',
    'Case Studies',
  ],
  CSAT: [
    'Comprehension',
    'Mathematics',
    'Reasoning',
    'Decision Making',
  ],
};

const SCHEDULE_GENERATION_PROMPT = `You are an expert UPSC study planner. Create a detailed day-by-day study schedule.

IMPORTANT RULES:
1. Use SIMPLIFIED language (10th grade reading level)
2. Provide both English and Hindi versions
3. Balance all subjects evenly across weeks
4. Include daily current affairs (30 min)
5. Include weekly mock tests (every Sunday)
6. Include revision slots (spaced repetition)
7. Account for buffer days (1 day per week)

INPUT:
- Exam Date: {exam_date}
- Daily Study Hours: {daily_hours}
- Subjects: {subjects}
- Optional Subject: {optional_subject}
- Current Date: {current_date}
- Level: {level}

OUTPUT FORMAT (JSON):
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "day_number": 1,
      "tasks": [
        {
          "task_type": "study|revision|mock_test|analysis|current_affairs",
          "subject": "GS1",
          "topic": "Indian Heritage and Culture",
          "subtopic": "Art Forms",
          "estimated_minutes": 90,
          "content_links": []
        }
      ]
    }
  ],
  "milestones": [
    {
      "type": "syllabus_25",
      "target_value": 25,
      "unit": "percentage",
      "title": { "en": "25% Syllabus Coverage", "hi": "25% पाठ्यक्रम पूर्णता" },
      "estimated_date": "YYYY-MM-DD"
    }
  ]
}

Generate schedule for {total_days} days with approximately {tasks_per_day} tasks per day.`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ScheduleGeneratorService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Generate complete study schedule
   */
  async generateSchedule(input: StudyPlanInput): Promise<GeneratedSchedule> {
    const currentDate = new Date();
    const examDate = new Date(input.examDate);
    const totalDays = Math.ceil((examDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyMinutes = input.dailyStudyHours * 60;
    const tasksPerDay = Math.floor(dailyMinutes / 60); // Average 60 min per task

    // Prepare AI prompt
    const prompt = SCHEDULE_GENERATION_PROMPT
      .replace('{exam_date}', input.examDate)
      .replace('{daily_hours}', input.dailyStudyHours.toString())
      .replace('{subjects}', input.subjects.join(', '))
      .replace('{optional_subject}', input.optionalSubject || 'None')
      .replace('{current_date}', currentDate.toISOString().split('T')[0])
      .replace('{level}', input.currentLevel || 'intermediate')
      .replace('{total_days}', totalDays.toString())
      .replace('{tasks_per_day}', tasksPerDay.toString());

    // Generate schedule using AI
    const aiResponse = await generateAIResponse({
      prompt,
      provider: '9router',
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Parse AI response
    const scheduleData = this.parseAIResponse(aiResponse);

    // Create study plan in database
    const planResult = await this.createStudyPlan(input, totalDays);

    if (!planResult.planId) {
      throw new Error('Failed to create study plan');
    }

    // Save schedules to database
    await this.saveSchedules(planResult.planId, scheduleData.days);

    // Save milestones to database
    await this.saveMilestones(planResult.planId, scheduleData.milestones);

    // Create default study preferences
    await this.createDefaultPreferences(input.userId);

    return {
      planId: planResult.planId,
      totalDays,
      totalTasks: scheduleData.days.reduce((sum, day) => sum + day.tasks.length, 0),
      days: scheduleData.days,
      milestones: scheduleData.milestones,
    };
  }

  /**
   * Parse AI response into structured data
   */
  private parseAIResponse(response: string): { days: DaySchedule[]; milestones: any[] } {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const data = JSON.parse(jsonMatch[0]);

      return {
        days: data.days || [],
        milestones: data.milestones || [],
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return fallback schedule
      return this.generateFallbackSchedule();
    }
  }

  /**
   * Generate fallback schedule if AI fails
   */
  private generateFallbackSchedule(): { days: DaySchedule[]; milestones: any[] } {
    const days: DaySchedule[] = [];
    const currentDate = new Date();

    // Generate 7 days as fallback
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);

      const tasks: StudyTask[] = [
        {
          taskType: 'current_affairs',
          subject: 'CA',
          topic: 'Daily Current Affairs',
          estimatedMinutes: 30,
          aiGenerated: true,
        },
        {
          taskType: 'study',
          subject: 'GS1',
          topic: 'Indian Heritage and Culture',
          estimatedMinutes: 90,
          aiGenerated: true,
        },
        {
          taskType: 'study',
          subject: 'GS2',
          topic: 'Indian Constitution',
          estimatedMinutes: 90,
          aiGenerated: true,
        },
      ];

      // Add mock test on Sunday
      if (date.getDay() === 0) {
        tasks.push({
          taskType: 'mock_test',
          subject: 'Full Mock',
          topic: 'GS Mock Test',
          estimatedMinutes: 120,
          aiGenerated: true,
        });
      }

      days.push({
        date: date.toISOString().split('T')[0],
        dayNumber: i + 1,
        tasks,
        totalMinutes: tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
        status: 'pending',
      });
    }

    const milestones = [
      {
        type: 'syllabus_25',
        targetValue: 25,
        unit: 'percentage',
        title: { en: '25% Syllabus Coverage', hi: '25% पाठ्यक्रम पूर्णता' },
        estimatedDate: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];

    return { days, milestones };
  }

  /**
   * Create study plan in database
   */
  private async createStudyPlan(
    input: StudyPlanInput,
    totalDays: number
  ): Promise<{ planId: string | null }> {
    const { data, error } = await this.supabase
      .from('study_plans')
      .insert({
        user_id: input.userId,
        exam_date: input.examDate,
        daily_study_hours: input.dailyStudyHours,
        subjects: input.subjects,
        optional_subject: input.optionalSubject,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create study plan:', error);
      return { planId: null };
    }

    return { planId: data?.id || null };
  }

  /**
   * Save daily schedules to database
   */
  private async saveSchedules(planId: string, days: DaySchedule[]): Promise<void> {
    const schedules = days.map((day) => ({
      plan_id: planId,
      date: day.date,
      day_number: day.dayNumber,
      total_tasks: day.tasks.length,
      completed_tasks: 0,
      total_estimated_minutes: day.totalMinutes,
      status: day.status,
    }));

    const { error } = await this.supabase.from('study_schedules').insert(schedules);

    if (error) {
      console.error('Failed to save schedules:', error);
      throw error;
    }

    // Save individual tasks
    for (const day of days) {
      const scheduleResult = await this.supabase
        .from('study_schedules')
        .select('id')
        .eq('plan_id', planId)
        .eq('date', day.date)
        .single();

      if (scheduleResult.data) {
        const tasks = day.tasks.map((task, index) => ({
          schedule_id: scheduleResult.data.id,
          task_type: task.taskType,
          subject: task.subject,
          topic: task.topic,
          subtopic: task.subtopic,
          estimated_minutes: task.estimatedMinutes,
          content_links: task.contentLinks || [],
          order_index: index,
          ai_generated: task.aiGenerated,
        }));

        await this.supabase.from('study_tasks').insert(tasks);
      }
    }
  }

  /**
   * Save milestones to database
   */
  private async saveMilestones(
    planId: string,
    milestones: Array<{
      type: string;
      targetValue: number;
      unit: string;
      title: { en: string; hi: string };
      estimatedDate: string;
    }>
  ): Promise<void> {
    const milestonesData = milestones.map((milestone) => ({
      plan_id: planId,
      milestone_type: milestone.type,
      target_value: milestone.targetValue,
      current_value: 0,
      unit: milestone.unit,
      title: milestone.title.en,
      description: milestone.title.hi,
      estimated_date: milestone.estimatedDate,
    }));

    const { error } = await this.supabase.from('study_milestones').insert(milestonesData);

    if (error) {
      console.error('Failed to save milestones:', error);
    }
  }

  /**
   * Create default study preferences
   */
  private async createDefaultPreferences(userId: string): Promise<void> {
    const { error } = await this.supabase.from('study_preferences').upsert({
      user_id: userId,
      preferred_study_times: ['morning', 'evening'],
      break_frequency_minutes: 50,
      revision_interval_days: 7,
      mock_frequency_days: 7,
      wake_up_time: '06:00:00',
      sleep_time: '23:00:00',
    });

    if (error) {
      console.error('Failed to create preferences:', error);
    }
  }

  /**
   * Get UPSC syllabus structure
   */
  getSyllabusStructure(): typeof GS_SYLLABUS {
    return GS_SYLLABUS;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const scheduleGenerator = new ScheduleGeneratorService();
