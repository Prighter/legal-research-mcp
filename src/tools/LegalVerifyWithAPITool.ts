/**
 * Legal Verification Tool - Verifies legal analysis against EU legal databases
 * Cross-references legal findings with actual EU legislation, procedures, and precedents
 */

import { EULegalAPIClient, EULegalSearchResult, EULegalDocument } from '../shared/EULegalAPIClient.js';
import { DomainDetector } from '../shared/DomainDetector.js';
import { CitationFormatter } from '../shared/CitationFormatter.js';
import { logger } from '../utils/logger.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface LegalVerificationInput {
  query: string;
  searchTerms: string[];
  verificationScope?: 'eurlex' | 'prelex' | 'council' | 'all';
  maxResults?: number;
  includeAnalysis?: boolean;
}

export interface LegalVerificationResult {
  query: string;
  detectedDomain: string;
  verificationResults: EULegalSearchResult[];
  relevantDocuments: EULegalDocument[];
  verification_summary: string;
  recommendations: string[];
  limitations: string[];
  formatted_citations: string;
  inline_citations_text?: string;
}

export class LegalVerifyWithAPITool {
  private apiClient: EULegalAPIClient;
  private domainDetector: DomainDetector;
  private citationFormatter: CitationFormatter;
  
  constructor(domainDetector: DomainDetector) {
    this.apiClient = new EULegalAPIClient();
    this.domainDetector = domainDetector;
    this.citationFormatter = new CitationFormatter();
    
    logger.info('LegalVerifyWithAPITool initialized');
  }
  
  /**
   * Process a legal verification request
   * @param input - The input data
   * @returns Tool response
   */
  public async processVerification(input: unknown): Promise<CallToolResult> {
    try {
      logger.debug('Processing legal verification request', input);
      
      // Validate input
      const validatedInput = this.validateVerificationInput(input as LegalVerificationInput);
      
      // Detect legal domain
      const detectedDomain = this.domainDetector.detectDomain(validatedInput.query);
      
      // Extract search terms if not provided
      const searchTerms = validatedInput.searchTerms.length > 0 
        ? validatedInput.searchTerms 
        : this.extractSearchTerms(validatedInput.query, detectedDomain);
      
      // Perform verification based on scope
      const verificationResults = await this.performVerification(
        searchTerms, 
        validatedInput.verificationScope || 'all',
        validatedInput.maxResults || 10
      );
      
      // Extract most relevant documents
      const relevantDocuments = this.extractMostRelevantDocuments(verificationResults, validatedInput.maxResults || 10);
      
      // Analyze results and generate recommendations
      const analysis = this.analyzeVerificationResults(
        validatedInput.query,
        detectedDomain,
        verificationResults,
        relevantDocuments
      );
      
      // Create formatted citations
      const formattedCitations = this.citationFormatter.createEUCitationList(
        relevantDocuments,
        'Relevant EU Legal Sources'
      );
      
      // Create text with inline citations if analysis is requested
      let inlineCitationsText = undefined;
      if (validatedInput.includeAnalysis && analysis.summary) {
        inlineCitationsText = this.citationFormatter.addInlineCitations(
          analysis.summary,
          relevantDocuments
        );
      }
      
      // Format response
      const result: LegalVerificationResult = {
        query: validatedInput.query,
        detectedDomain,
        verificationResults,
        relevantDocuments,
        verification_summary: analysis.summary,
        recommendations: analysis.recommendations,
        limitations: analysis.limitations,
        formatted_citations: formattedCitations,
        inline_citations_text: inlineCitationsText
      };
      
      logger.debug('Legal verification completed successfully', {
        domain: detectedDomain,
        resultsCount: verificationResults.length,
        documentsCount: result.relevantDocuments.length
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }]
      } as CallToolResult;
      
    } catch (error) {
      logger.error('Error processing legal verification', error as Error);
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      } as CallToolResult;
    }
  }
  
  /**
   * Validate verification input
   * @param input - The input to validate
   * @returns Validated input
   */
  private validateVerificationInput(input: LegalVerificationInput): LegalVerificationInput {
    if (!input) {
      throw new Error('Input is required');
    }
    
    if (!input.query || typeof input.query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }
    
    if (!input.searchTerms || !Array.isArray(input.searchTerms)) {
      input.searchTerms = [];
    }
    
    if (input.verificationScope && !['eurlex', 'prelex', 'council', 'all'].includes(input.verificationScope)) {
      throw new Error('Invalid verification scope. Must be: eurlex, prelex, council, or all');
    }
    
    if (input.maxResults && (typeof input.maxResults !== 'number' || input.maxResults < 1 || input.maxResults > 50)) {
      throw new Error('Max results must be a number between 1 and 50');
    }
    
    return {
      query: input.query.trim(),
      searchTerms: input.searchTerms.map(term => term.trim()).filter(term => term.length > 0),
      verificationScope: input.verificationScope || 'all',
      maxResults: input.maxResults || 10,
      includeAnalysis: input.includeAnalysis !== false
    };
  }
  
  /**
   * Extract search terms from query based on domain
   * @param query - The query text
   * @param domain - The detected legal domain
   * @returns Array of search terms
   */
  private extractSearchTerms(query: string, domain: string): string[] {
    const terms: string[] = [];
    
    // Common legal terms
    const legalTerms = ['directive', 'regulation', 'decision', 'law', 'article', 'provision'];
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Add detected legal terms
    legalTerms.forEach(term => {
      if (queryWords.includes(term)) {
        terms.push(term);
      }
    });
    
    // Add domain-specific terms
    if (domain === 'ansc_contestation') {
      const procurementTerms = ['procurement', 'tender', 'contestation', 'technical specification', 'award criteria'];
      procurementTerms.forEach(term => {
        if (query.toLowerCase().includes(term.toLowerCase())) {
          terms.push(term);
        }
      });
    } else if (domain === 'consumer_protection') {
      const consumerTerms = ['consumer', 'protection', 'warranty', 'product', 'refund', 'safety'];
      consumerTerms.forEach(term => {
        if (query.toLowerCase().includes(term.toLowerCase())) {
          terms.push(term);
        }
      });
    } else if (domain === 'contract_analysis') {
      const contractTerms = ['contract', 'clause', 'obligation', 'liability', 'agreement'];
      contractTerms.forEach(term => {
        if (query.toLowerCase().includes(term.toLowerCase())) {
          terms.push(term);
        }
      });
    }
    
    // Extract potential legal references (e.g., "Law 131/2015", "Article 113")
    const legalRefs = query.match(/(?:law|article|directive|regulation)\s+\d+(?:\/\d+)?/gi);
    if (legalRefs) {
      terms.push(...legalRefs);
    }
    
    // If no specific terms found, use significant words from query
    if (terms.length === 0) {
      const significantWords = queryWords.filter(word => 
        word.length > 3 && 
        !['the', 'and', 'or', 'but', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'been', 'their'].includes(word)
      );
      terms.push(...significantWords.slice(0, 5));
    }
    
    return terms;
  }
  
  /**
   * Perform verification across requested sources
   * @param searchTerms - Terms to search for
   * @param scope - Verification scope
   * @param maxResults - Maximum results per search
   * @returns Array of search results
   */
  private async performVerification(
    searchTerms: string[], 
    scope: string, 
    maxResults: number
  ): Promise<EULegalSearchResult[]> {
    const results: EULegalSearchResult[] = [];
    
    try {
      if (scope === 'all' || scope === 'eurlex') {
        // Smart search EUR-Lex
        const eurlexResults = await this.apiClient.smartSearch(searchTerms, maxResults);
        results.push(...eurlexResults);
        
        // Additional EUR-Lex searches for specific legal forms
        if (searchTerms.some(term => /directive/i.test(term))) {
          const directiveResults = await this.apiClient.searchEURLexByForm('Directive');
          if (directiveResults.total > 0) {
            directiveResults.documents = directiveResults.documents.slice(0, Math.floor(maxResults / 2));
            results.push(directiveResults);
          }
        }
        
        if (searchTerms.some(term => /regulation/i.test(term))) {
          const regulationResults = await this.apiClient.searchEURLexByForm('Regulation');
          if (regulationResults.total > 0) {
            regulationResults.documents = regulationResults.documents.slice(0, Math.floor(maxResults / 2));
            results.push(regulationResults);
          }
        }
      }
      
      if (scope === 'all' || scope === 'prelex') {
        // Search PreLex for procedural information
        const procedureTerms = searchTerms.filter(term => 
          /procedure|commission|council|parliament/i.test(term)
        );
        
        if (procedureTerms.length > 0) {
          for (const term of procedureTerms.slice(0, 2)) {
            const prelexResults = await this.apiClient.searchPrelexByProcedure(term);
            if (prelexResults.total > 0) {
              prelexResults.documents = prelexResults.documents.slice(0, Math.floor(maxResults / 2));
              results.push(prelexResults);
            }
          }
        }
        
        // Search by DG if relevant
        if (searchTerms.some(term => /environment|competition|trade|internal market/i.test(term))) {
          const dgMap: Record<string, string> = {
            'environment': 'DG Environment',
            'competition': 'DG Competition', 
            'trade': 'DG Trade',
            'internal market': 'DG Internal Market'
          };
          
          for (const [searchTerm, dg] of Object.entries(dgMap)) {
            if (searchTerms.some(term => new RegExp(searchTerm, 'i').test(term))) {
              const dgResults = await this.apiClient.searchPrelexByDG(dg);
              if (dgResults.total > 0) {
                dgResults.documents = dgResults.documents.slice(0, Math.floor(maxResults / 3));
                results.push(dgResults);
              }
              break; // Only search one DG to avoid too many results
            }
          }
        }
      }
      
      if (scope === 'all' || scope === 'council') {
        // Search Council votes for recent years (2009-2011 based on API data)
        const recentYears = ['2011', '2010', '2009'];
        for (const year of recentYears) {
          const councilResults = await this.apiClient.getCouncilVotesByYear(year);
          if (councilResults.total > 0) {
            councilResults.documents = councilResults.documents.slice(0, Math.floor(maxResults / 3));
            results.push(councilResults);
            break; // Only get one year to avoid too many results
          }
        }
      }
      
    } catch (error) {
      logger.error('Error during verification', error as Error);
    }
    
    return results;
  }
  
  /**
   * Analyze verification results and provide insights
   * @param query - Original query
   * @param domain - Detected domain
   * @param results - Search results
   * @param documents - Relevant documents found
   * @returns Analysis object
   */
  private analyzeVerificationResults(
    query: string, 
    domain: string, 
    results: EULegalSearchResult[],
    documents: EULegalDocument[]
  ): { summary: string; recommendations: string[]; limitations: string[] } {
    const totalDocuments = results.reduce((sum, result) => sum + result.total, 0);
    const sourcesUsed = [...new Set(results.map(result => result.source))];
    
    let summary = '';
    const recommendations: string[] = [];
    const limitations: string[] = [];
    
    // Generate summary with specific document references
    if (totalDocuments === 0) {
      summary = 'No relevant EU legal documents were found for the specified search terms. This could indicate that the legal issue may fall outside EU competence or may require different search terms.';
      recommendations.push('Consider refining search terms or checking if this is primarily a national law issue');
      recommendations.push('Verify if the legal framework has changed since the API data cutoff (2013 for EUR-Lex)');
    } else {
      summary = `Found ${totalDocuments} relevant documents across ${sourcesUsed.length} EU legal sources (${sourcesUsed.join(', ')}). `;
      
      // Add specific document type analysis
      if (documents.length > 0) {
        const directives = documents.filter(doc => doc.form?.toLowerCase().includes('directive'));
        const regulations = documents.filter(doc => doc.form?.toLowerCase().includes('regulation'));
        const decisions = documents.filter(doc => doc.form?.toLowerCase().includes('decision'));
        
        if (directives.length > 0) {
          summary += `Key directives include ${this.summarizeKeyDocuments(directives, 2)}. `;
        }
        if (regulations.length > 0) {
          summary += `Relevant regulations include ${this.summarizeKeyDocuments(regulations, 2)}. `;
        }
        if (decisions.length > 0) {
          summary += `Important decisions include ${this.summarizeKeyDocuments(decisions, 1)}. `;
        }
      }
      
      // Add domain-specific guidance with document context
      if (domain === 'ansc_contestation') {
        summary += 'For procurement contestation analysis, ensure compliance with EU public procurement directives and their national implementation.';
        recommendations.push('Cross-reference with national procurement law implementing these directives');
        recommendations.push('Check ANSC jurisprudence database for recent interpretations');
        
        // Add specific procurement directive recommendations if found
        const procurementDocs = documents.filter(doc => 
          doc.title && /procurement|tender|public.*contract/i.test(doc.title)
        );
        if (procurementDocs.length > 0) {
          recommendations.push('Focus on the procurement directives found in the search results for framework analysis');
        }
      } else if (domain === 'consumer_protection') {
        summary += 'Consumer protection cases should reference EU consumer directives and regulations on product safety and consumer rights.';
        recommendations.push('Verify with national consumer protection law implementing EU directives');
        recommendations.push('Check for recent ECJ rulings on consumer protection interpretation');
        
        // Add specific consumer law recommendations if found
        const consumerDocs = documents.filter(doc => 
          doc.title && /consumer|product.*safety|warranty/i.test(doc.title)
        );
        if (consumerDocs.length > 0) {
          recommendations.push('Review the consumer protection instruments identified in the search results');
        }
      } else if (domain === 'contract_analysis') {
        summary += 'Contract analysis should consider EU regulations on unfair contract terms and consumer contracts where applicable.';
        recommendations.push('Review national civil code provisions implementing EU contract law');
        recommendations.push('Consider Rome I Regulation for international contracts');
        
        // Add specific contract law recommendations if found
        const contractDocs = documents.filter(doc => 
          doc.title && /contract|unfair.*term|consumer.*right/i.test(doc.title)
        );
        if (contractDocs.length > 0) {
          recommendations.push('Analyze the contract-related EU instruments found in the results');
        }
      }
    }
    
    // Add general limitations
    limitations.push('EU legal database covers legislation up to 2013 for EUR-Lex and 2011 for PreLex');
    limitations.push('Recent amendments, new legislation, and ECJ rulings may not be included');
    limitations.push('National implementing legislation and jurisprudence should be checked separately');
    limitations.push('This tool provides reference material, not legal advice');
    
    // Add domain-specific limitations
    if (domain === 'ansc_contestation') {
      limitations.push('ANSC decisions and recent procurement jurisprudence not included in this search');
      limitations.push('National procurement remedies procedures may differ from EU framework');
    }
    
    return { summary, recommendations, limitations };
  }
  
  /**
   * Extract most relevant documents from search results
   * @param results - Search results
   * @param maxDocs - Maximum number of documents to return
   * @returns Array of most relevant documents
   */
  private extractMostRelevantDocuments(results: EULegalSearchResult[], maxDocs: number): EULegalDocument[] {
    const allDocuments: EULegalDocument[] = [];
    
    // Collect all documents
    results.forEach(result => {
      allDocuments.push(...result.documents);
    });
    
    // Remove duplicates based on ID or title
    const uniqueDocuments = allDocuments.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id || (d.title && d.title === doc.title))
    );
    
    // Sort by relevance (prefer directives and regulations over decisions)
    const sortedDocuments = uniqueDocuments.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a);
      const bScore = this.calculateRelevanceScore(b);
      return bScore - aScore;
    });
    
    return sortedDocuments.slice(0, maxDocs);
  }
  
  /**
   * Calculate relevance score for a document
   * @param doc - The document
   * @returns Relevance score
   */
  private calculateRelevanceScore(doc: EULegalDocument): number {
    let score = 0;
    
    // Form-based scoring
    if (doc.form) {
      if (doc.form.toLowerCase().includes('directive')) score += 10;
      else if (doc.form.toLowerCase().includes('regulation')) score += 8;
      else if (doc.form.toLowerCase().includes('decision')) score += 5;
    }
    
    // Recency bonus (rough estimation based on CELEX number patterns)
    if (doc.celex_number) {
      const yearMatch = doc.celex_number.match(/(\d{4})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        if (year > 2005) score += 3;
        if (year > 2010) score += 2;
      }
    }
    
    // Author relevance
    if (doc.author && doc.author.includes('Commission')) score += 2;
    if (doc.author && doc.author.includes('Parliament')) score += 2;
    if (doc.author && doc.author.includes('Council')) score += 2;
    
    return score;
  }
  
  /**
   * Summarize key documents for inclusion in analysis text
   * @param documents - Array of documents to summarize
   * @param maxDocs - Maximum number of documents to mention
   * @returns Summary string
   */
  private summarizeKeyDocuments(documents: EULegalDocument[], maxDocs: number): string {
    if (documents.length === 0) return '';
    
    const topDocs = documents.slice(0, maxDocs);
    const summaries: string[] = [];
    
    topDocs.forEach(doc => {
      let summary = '';
      
      // Extract key information for summary
      if (doc.form && doc.date) {
        const year = new Date(doc.date).getFullYear();
        let number = '';
        
        // Try to extract number from CELEX or title
        if (doc.celex_number) {
          const celexMatch = doc.celex_number.match(/(\d{4})[LRD](\d{4})/);
          if (celexMatch) {
            number = `${celexMatch[2]}/${celexMatch[1]}`;
          }
        }
        
        summary = doc.form;
        if (number) {
          summary += ` ${number}`;
        }
        summary += ` (${year})`;
      } else {
        // Fallback to title or form
        summary = doc.title || doc.form || 'EU Document';
        if (summary.length > 50) {
          summary = summary.substring(0, 47) + '...';
        }
      }
      
      summaries.push(summary);
    });
    
    if (documents.length > maxDocs) {
      summaries.push(`and ${documents.length - maxDocs} other${documents.length - maxDocs > 1 ? 's' : ''}`);
    }
    
    return summaries.join(', ');
  }
}
