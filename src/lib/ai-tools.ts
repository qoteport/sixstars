'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeServerFirebase } from '@/migrations/001-migrate-software';
import { 
  collection, 
  getDocs, 
  getFirestore, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { softwareProductSchema } from '@/lib/types';

// Define the Zod schema for the tool's input with enhanced search options
const SearchSoftwareInputSchema = z.object({
  query: z.string().describe('Search query for software products. Can include names, categories, features, or use advanced operators like "category:CRM", "rating:>4", "model:premium"'),
  category: z.string().optional().describe('Filter by specific category (e.g., "CRM", "Project Management", "Accounting")'),
  minRating: z.number().min(0).max(5).optional().describe('Minimum rating threshold (0-5)'),
  maxResults: z.number().min(1).max(50).default(20).describe('Maximum number of results to return (1-50)'),
  sortBy: z.enum(['name', 'rating', 'clicks', 'relevance']).default('relevance').describe('Sort order for results')
});

// Define the Zod schema for the tool's output
const SearchSoftwareOutputSchema = z.object({
  products: z.array(softwareProductSchema),
  totalMatches: z.number(),
  searchSummary: z.string(),
  hasMore: z.boolean()
});

// Search index for better text matching
interface SearchIndex {
  name: string;
  description: string;
  features: string[];
  category: string;
  model: string;
  tags: string[];
}

// Predefined categories for better filtering
const SOFTWARE_CATEGORIES = [
  'CRM', 'Project Management', 'Accounting', 'Marketing', 'Sales', 
  'Communication', 'Development', 'Design', 'Analytics', 'Security',
  'HR', 'Productivity', 'E-commerce', 'Support', 'Storage'
];

// Scoring weights for relevance ranking
const RELEVANCE_WEIGHTS = {
  name: 3,
  category: 2,
  features: 1.5,
  description: 1,
  model: 0.5
};

// Logging utility for the tool
class SearchToolLogger {
  static logSearch(query: string, filters: any, results: number, duration: number) {
    console.log(`[searchSoftware] Query: "${query}" | Filters: ${JSON.stringify(filters)} | Results: ${results} | Duration: ${duration}ms`);
  }

  static logError(query: string, error: any) {
    console.error(`[searchSoftware] Error for query "${query}":`, error);
  }

  static logDebug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[searchSoftware] ${message}`, data);
    }
  }
}

/**
 * Enhanced search tool with better query parsing, filtering, and relevance scoring
 */
export const searchSoftware = ai.defineTool(
  {
    name: 'searchSoftware',
    description: 'Searches the software product database with advanced filtering and ranking. Supports category filters, rating thresholds, and relevance-based sorting.',
    inputSchema: SearchSoftwareInputSchema,
    outputSchema: SearchSoftwareOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    
    try {
      SearchToolLogger.logDebug('Starting search', input);

      const app = await initializeServerFirebase();
      const firestore = getFirestore(app);
      const productsRef = collection(firestore, 'softwareProducts');

      // Build the base query for published products
      const constraints = [where('status', '==', 'Published')];

      // Add category filter if specified
      if (input.category) {
        constraints.push(where('category', '==', input.category));
      }

      // Add rating filter if specified
      if (input.minRating) {
        constraints.push(where('rating', '>=', input.minRating));
      }

      // Create and execute the query
      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const allProducts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, _doc: doc };
      });

      SearchToolLogger.logDebug(`Retrieved ${allProducts.length} published products from database`);

      // Parse advanced query operators
      const { searchTerms, filters } = parseAdvancedQuery(input.query);
      
      // Filter and score products based on search relevance
      const scoredProducts = allProducts
        .map(product => {
          const result = softwareProductSchema.safeParse(product);
          if (!result.success) {
            SearchToolLogger.logDebug(`Invalid product schema for ${product._doc.id}`, result.error.flatten());
            return null;
          }

          const validatedProduct = result.data;
          const searchIndex = buildSearchIndex(validatedProduct);
          const score = calculateRelevanceScore(searchIndex, searchTerms, filters);
          
          return { product: validatedProduct, score };
        })
        .filter((item): item is { product: any, score: number } => item !== null && item.score > 0)
        .sort((a, b) => b.score - a.score); // Sort by relevance score descending

      // Apply final sorting based on user preference
      const sortedProducts = applyFinalSorting(
        scoredProducts.map(item => item.product), 
        scoredProducts.map(item => item.score), 
        input.sortBy
      );

      // Limit results
      const finalProducts = sortedProducts.slice(0, input.maxResults);
      const hasMore = sortedProducts.length > input.maxResults;

      // Generate search summary
      const searchSummary = generateSearchSummary(
        input.query, 
        finalProducts.length, 
        scoredProducts.length,
        input.category,
        input.minRating
      );

      const duration = Date.now() - startTime;
      SearchToolLogger.logSearch(input.query, { category: input.category, minRating: input.minRating }, finalProducts.length, duration);

      return {
        products: finalProducts,
        totalMatches: scoredProducts.length,
        searchSummary,
        hasMore
      };

    } catch (error) {
      SearchToolLogger.logError(input.query, error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

/**
 * Parses advanced query syntax like "category:CRM rating:>4"
 */
function parseAdvancedQuery(rawQuery: string): { searchTerms: string[], filters: Record<string, string> } {
  const filters: Record<string, string> = {};
  const searchTerms: string[] = [];
  
  const tokens = rawQuery.split(/\s+/);
  
  tokens.forEach(token => {
    // Check for filter syntax: key:value
    const filterMatch = token.match(/^(\w+):(.+)$/);
    if (filterMatch) {
      const [, key, value] = filterMatch;
      filters[key.toLowerCase()] = value.toLowerCase();
    } else {
      // Regular search term
      searchTerms.push(token.toLowerCase());
    }
  });

  return { searchTerms, filters };
}

/**
 * Builds a search index from product data for better matching
 */
function buildSearchIndex(product: any): SearchIndex {
  return {
    name: product.name?.toLowerCase() || '',
    description: product.description?.toLowerCase() || '',
    features: product.features?.map((f: string) => f.toLowerCase()) || [],
    category: product.category?.toLowerCase() || '',
    model: product.model?.toLowerCase() || '',
    tags: [
      product.name?.toLowerCase(),
      product.category?.toLowerCase(),
      product.model?.toLowerCase(),
      ...(product.features?.map((f: string) => f.toLowerCase()) || [])
    ].filter(Boolean)
  };
}

/**
 * Calculates relevance score for a product based on search terms and filters
 */
function calculateRelevanceScore(index: SearchIndex, searchTerms: string[], filters: Record<string, string>): number {
  let score = 0;

  // Apply filters first - if any filter doesn't match, return 0
  for (const [key, value] of Object.entries(filters)) {
    switch (key) {
      case 'category':
        if (!index.category.includes(value)) return 0;
        break;
      case 'rating':
        // This would need the actual product rating, handled in main query
        break;
      case 'model':
        if (!index.model.includes(value)) return 0;
        break;
      default:
        // For unknown filters, check all searchable fields
        if (!index.tags.some(tag => tag.includes(value))) return 0;
    }
  }

  // If no search terms, return base score for filtered results
  if (searchTerms.length === 0) return 1;

  // Calculate relevance based on search terms
  for (const term of searchTerms) {
    if (index.name.includes(term)) {
      score += RELEVANCE_WEIGHTS.name;
    }
    if (index.category.includes(term)) {
      score += RELEVANCE_WEIGHTS.category;
    }
    if (index.features.some(feature => feature.includes(term))) {
      score += RELEVANCE_WEIGHTS.features;
    }
    if (index.description.includes(term)) {
      score += RELEVANCE_WEIGHTS.description;
    }
    if (index.model.includes(term)) {
      score += RELEVANCE_WEIGHTS.model;
    }
  }

  return score;
}

/**
 * Applies final sorting based on user preference
 */
function applyFinalSorting(products: any[], relevanceScores: number[], sortBy: string): any[] {
  switch (sortBy) {
    case 'name':
      return [...products].sort((a, b) => a.name.localeCompare(b.name));
    
    case 'rating':
      return [...products].sort((a, b) => b.rating - a.rating);
    
    case 'clicks':
      return [...products].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    
    case 'relevance':
    default:
      // Already sorted by relevance, just return as is
      return products;
  }
}

/**
 * Generates a human-readable search summary
 */
function generateSearchSummary(
  query: string, 
  displayed: number, 
  total: number, 
  category?: string, 
  minRating?: number
): string {
  const parts = [];
  
  if (query && query.trim()) {
    parts.push(`query "${query}"`);
  }
  
  if (category) {
    parts.push(`category ${category}`);
  }
  
  if (minRating) {
    parts.push(`rating ${minRating}+`);
  }
  
  const criteria = parts.length > 0 ? ` matching ${parts.join(', ')}` : '';
  
  return `Found ${displayed} of ${total} products${criteria}`;
}