import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface AISuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export function AISuggestions() {
  const { data: suggestions, isLoading, error } = useQuery<AISuggestion[]>({
    queryKey: ['ai-suggestions'],
    queryFn: async () => {
      const response = await fetch('/api/ai/suggestions');
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Suggestions</CardTitle>
          <CardDescription>Loading suggestions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Suggestions</CardTitle>
          <CardDescription>Failed to load suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Suggestions</CardTitle>
        <CardDescription>Personalized recommendations for growth</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {suggestions?.map((suggestion, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                suggestion.priority === 'high'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : suggestion.priority === 'medium'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20'
                  : 'bg-green-50 dark:bg-green-900/20'
              }`}
            >
              <h3 className="font-semibold mb-2">{suggestion.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {suggestion.description}
              </p>
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    suggestion.priority === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : suggestion.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  {suggestion.priority.toUpperCase()}
                </span>
                <Button variant="outline" size="sm">
                  {suggestion.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 