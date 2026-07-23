import { SearchResult } from '../types';
import fetch from 'node-fetch';
import { settings } from '../config/settings';

export class SearchService {
  private tavilyKey?: string;
  private redditClientId?: string;
  private redditSecret?: string;
  private xBearer?: string;

  constructor() {
    this.tavilyKey = settings.get('tavilyApiKey');
    this.redditClientId = settings.get('redditClientId');
    this.redditSecret = settings.get('redditClientSecret');
    this.xBearer = settings.get('xBearerToken');
  }

  async webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
    if (!this.tavilyKey) {
      return [{ title: 'No search API configured', url: '', snippet: 'Configure Tavily API key in Settings (Ctrl+P)', source: 'system' }];
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: this.tavilyKey, query, max_results: maxResults }),
      });

      const data = await response.json() as any;
      return (data.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        source: 'web',
      }));
    } catch (error) {
      return [{ title: 'Search failed', url: '', snippet: String(error), source: 'error' }];
    }
  }

  async redditSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
    if (!this.redditClientId || !this.redditSecret) {
      return [{ title: 'Reddit not configured', url: '', snippet: 'Configure Reddit credentials in Settings', source: 'system' }];
    }

    try {
      const auth = Buffer.from(`${this.redditClientId}:${this.redditSecret}`).toString('base64');
      const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
      });
      const tokenData = await tokenRes.json() as any;
      const accessToken = tokenData.access_token;

      const searchRes = await fetch(`https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&limit=${maxResults}&sort=relevance`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const searchData = await searchRes.json() as any;

      return (searchData.data?.children || []).map((post: any) => ({
        title: post.data.title,
        url: `https://reddit.com${post.data.permalink}`,
        snippet: post.data.selftext?.slice(0, 300) || post.data.title,
        source: 'reddit',
      }));
    } catch (error) {
      return [{ title: 'Reddit search failed', url: '', snippet: String(error), source: 'error' }];
    }
  }

  async xSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
    if (!this.xBearer) {
      return [{ title: 'X/Twitter not configured', url: '', snippet: 'Configure X Bearer Token in Settings', source: 'system' }];
    }

    try {
      const response = await fetch(`https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}`, {
        headers: { Authorization: `Bearer ${this.xBearer}` },
      });
      const data = await response.json() as any;
      return (data.data || []).map((tweet: any) => ({
        title: tweet.text?.slice(0, 100) || 'Tweet',
        url: `https://x.com/i/web/status/${tweet.id}`,
        snippet: tweet.text,
        source: 'x',
      }));
    } catch (error) {
      return [{ title: 'X search failed', url: '', snippet: String(error), source: 'error' }];
    }
  }
}
