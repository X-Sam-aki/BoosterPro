import { DatabaseStorage } from '../storage';

interface SocialAccount {
  id: number;
  userId: string;
  platform: string;
  username: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  engagementRate: number;
  lastUpdated: Date;
}

interface Post {
  id: number;
  accountId: number;
  content: string;
  type: 'image' | 'video' | 'text';
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  createdAt: Date;
}

interface EngagementData {
  date: Date;
  followers: number;
  likes: number;
  comments: number;
  shares: number;
}

export class SocialService {
  constructor(private storage: DatabaseStorage) {}

  async getAccounts(userId: string): Promise<SocialAccount[]> {
    return this.storage.getSocialAccounts(userId);
  }

  async getAccount(accountId: number): Promise<SocialAccount | null> {
    return this.storage.getSocialAccount(accountId);
  }

  async connectAccount(userId: string, platform: string, username: string): Promise<SocialAccount> {
    return this.storage.createSocialAccount({
      userId,
      platform,
      username,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      engagementRate: 0,
      lastUpdated: new Date(),
    });
  }

  async updateAccountStats(userId: string, accountId: number): Promise<SocialAccount> {
    const account = await this.getAccount(accountId);
    if (!account || account.userId !== userId) {
      throw new Error('Account not found');
    }

    // Simulate fetching updated stats from social platform API
    const updatedStats = {
      followerCount: account.followerCount + Math.floor(Math.random() * 100),
      followingCount: account.followingCount + Math.floor(Math.random() * 50),
      postCount: account.postCount + 1,
      engagementRate: Math.random() * 10,
      lastUpdated: new Date(),
    };

    return this.storage.updateSocialAccount(accountId, updatedStats);
  }

  async deleteAccount(userId: string, accountId: number): Promise<void> {
    const account = await this.getAccount(accountId);
    if (!account || account.userId !== userId) {
      throw new Error('Account not found');
    }

    await this.storage.deleteSocialAccount(accountId);
  }

  async getPosts(accountId: number): Promise<Post[]> {
    return this.storage.getPosts(accountId);
  }

  async getEngagementData(accountId: number, startDate: Date, endDate: Date): Promise<EngagementData[]> {
    const posts = await this.getPosts(accountId);
    const engagementData: EngagementData[] = [];

    // Generate daily engagement data
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dailyPosts = posts.filter(post => {
        const postDate = new Date(post.createdAt);
        return postDate.toDateString() === date.toDateString();
      });

      engagementData.push({
        date: new Date(date),
        followers: Math.floor(Math.random() * 1000), // Simulated data
        likes: dailyPosts.reduce((sum, post) => sum + post.likes, 0),
        comments: dailyPosts.reduce((sum, post) => sum + post.comments, 0),
        shares: dailyPosts.reduce((sum, post) => sum + post.shares, 0),
      });
    }

    return engagementData;
  }

  async calculateGrowthRate(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const accounts = await this.getAccounts(userId);
    const totalFollowers = accounts.reduce((sum, acc) => sum + acc.followerCount, 0);
    
    // Simulate growth rate calculation
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const growthRate = (totalFollowers * 0.1) / days; // 10% growth over the period
    
    return Math.round(growthRate * 100) / 100;
  }

  async getMessages(accountId: number): Promise<any[]> {
    return this.storage.getMessages(accountId);
  }

  async getComments(accountId: number): Promise<any[]> {
    return this.storage.getComments(accountId);
  }

  async getMentions(accountId: number): Promise<any[]> {
    return this.storage.getMentions(accountId);
  }
} 