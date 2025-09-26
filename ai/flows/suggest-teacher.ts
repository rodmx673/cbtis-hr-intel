'use server';

/**
 * @fileOverview Teacher auto-suggestion flow for subject assignment.
 *
 * - suggestTeacher - A function that suggests teacher names based on the selected subject.
 * - SuggestTeacherInput - The input type for the suggestTeacher function.
 * - SuggestTeacherOutput - The return type for the suggestTeacher function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTeacherInputSchema = z.object({
  subject: z.string().describe('The name of the subject.'),
});
export type SuggestTeacherInput = z.infer<typeof SuggestTeacherInputSchema>;

const SuggestTeacherOutputSchema = z.object({
  teacherName: z.string().describe('Suggested teacher name for the subject.'),
});
export type SuggestTeacherOutput = z.infer<typeof SuggestTeacherOutputSchema>;

export async function suggestTeacher(input: SuggestTeacherInput): Promise<SuggestTeacherOutput> {
  return suggestTeacherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTeacherPrompt',
  input: {schema: SuggestTeacherInputSchema},
  output: {schema: SuggestTeacherOutputSchema},
  prompt: `You are an AI assistant specialized in suggesting teacher names for specific subjects.

  Based on the subject provided, suggest a teacher name that is commonly associated with teaching that subject. The suggestion should be concise, and to the point.

  Subject: {{{subject}}}
  `,
});

const suggestTeacherFlow = ai.defineFlow(
  {
    name: 'suggestTeacherFlow',
    inputSchema: SuggestTeacherInputSchema,
    outputSchema: SuggestTeacherOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
