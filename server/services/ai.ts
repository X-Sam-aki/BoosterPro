import OpenAI from 'openai';
import { storage } from '../storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface UserStats {
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
}

interface AISuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export class AIService {
  static async analyzeUserProfile(userId: string): Promise<AISuggestion[]> {
    try {
      // Get user's social media stats
      const stats = await storage.getUserStats(userId);
      
      // Get user's recent posts
      const recentPosts = await storage.getRecentPosts(userId);
      
      // Get user's engagement history
      const engagementHistory = await storage.getEngagementHistory(userId);

      // Prepare the prompt for OpenAI
      const prompt = this.generateAnalysisPrompt(stats, recentPosts, engagementHistory);

      // Get AI analysis
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a social media growth expert. Analyze the provided data and give specific, actionable recommendations for growth."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-4",
        temperature: 0.7,
      });

      // Parse the AI response into structured suggestions
      const suggestions = this.parseAISuggestions(completion.choices[0].message.content || '');

      return suggestions;
    } catch (error) {
      console.error('Error in AI analysis:', error);
      throw new Error('Failed to generate AI suggestions');
    }
  }

  private static generateAnalysisPrompt(
    stats: UserStats,
    recentPosts: any[],
    engagementHistory: any[]
  ): string {
    return `
      Analyze this social media profile and provide growth recommendations:
      
      Current Stats:
      - Followers: ${stats.followers}
      - Following: ${stats.following}
      - Posts: ${stats.posts}
      - Engagement Rate: ${stats.engagementRate}%
      - Average Likes: ${stats.averageLikes}
      - Average Comments: ${stats.averageComments}
      
      Recent Posts (last 5):
      ${recentPosts.map(post => `
        - Type: ${post.type}
        - Likes: ${post.likes}
        - Comments: ${post.comments}
        - Caption: ${post.caption}
      `).join('\n')}
      
      Engagement History:
      ${engagementHistory.map(entry => `
        - Date: ${entry.date}
        - New Followers: ${entry.newFollowers}
        - Lost Followers: ${entry.lostFollowers}
        - Engagement Rate: ${entry.engagementRate}%
      `).join('\n')}
      
      Please provide specific, actionable recommendations for growth.
    `;
  }

  private static parseAISuggestions(aiResponse: string): AISuggestion[] {
    // Split the response into individual suggestions
    const suggestionBlocks = aiResponse.split('\n\n').filter(block => block.trim());
    
    return suggestionBlocks.map(block => {
      const lines = block.split('\n');
      return {
        title: lines[0].replace('Title:', '').trim(),
        description: lines[1].replace('Description:', '').trim(),
        priority: (lines[2].replace('Priority:', '').trim().toLowerCase() as 'high' | 'medium' | 'low'),
        action: lines[3].replace('Action:', '').trim(),
      };
    });
  }
} 