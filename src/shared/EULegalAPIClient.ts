/**
 * EU Legal API Client
 * Interface for accessing European Union legal databases
 * Based on api.epdb.eu documentation
 */

export interface EULegalDocument {
  id: string;
  title?: string;
  author?: string;
  form?: string;
  date?: string;
  legal_basis?: string;
  directory_codes?: string[];
  eurovoc_descriptors?: string[];
  celex_number?: string;
  url?: string;
  subject_matter?: string;
  addressee?: string;
}

export interface EULegalSearchResult {
  documents: EULegalDocument[];
  total: number;
  source: 'eurlex' | 'prelex' | 'council';
}

export class EULegalAPIClient {
  private readonly baseUrl = 'http://api.epdb.eu';
  
  /**
   * Search EUR-Lex documents by form (directive, regulation, decision)
   * @param form - The form of legal act (e.g., 'Directive', 'Regulation', 'Decision')
   * @returns Promise<EULegalSearchResult>
   */
  async searchEURLexByForm(form: string): Promise<EULegalSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/eurlex/form/?form=${encodeURIComponent(form)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        documents: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        source: 'eurlex'
      };
    } catch (error) {
      console.error('Error searching EUR-Lex by form:', error);
      return { documents: [], total: 0, source: 'eurlex' };
    }
  }
  
  /**
   * Search EUR-Lex documents by author
   * @param author - The author (e.g., 'European Commission', 'European Central Bank')
   * @returns Promise<EULegalSearchResult>
   */
  async searchEURLexByAuthor(author: string): Promise<EULegalSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/eurlex/author/?author=${encodeURIComponent(author)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        documents: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        source: 'eurlex'
      };
    } catch (error) {
      console.error('Error searching EUR-Lex by author:', error);
      return { documents: [], total: 0, source: 'eurlex' };
    }
  }
  
  /**
   * Search EUR-Lex documents by legal basis
   * @param legalBasis - The legal basis reference
   * @returns Promise<EULegalSearchResult>
   */
  async searchEURLexByLegalBasis(legalBasis: string): Promise<EULegalSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/eurlex/legal_basis/?legal_basis=${encodeURIComponent(legalBasis)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        documents: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        source: 'eurlex'
      };
    } catch (error) {
      console.error('Error searching EUR-Lex by legal basis:', error);
      return { documents: [], total: 0, source: 'eurlex' };
    }
  }
  
  /**
   * Search EUR-Lex documents by directory code (subject classification)
   * @param directoryCode - The directory code (e.g., '07.40.30.00' for air safety)
   * @returns Promise<EULegalSearchResult>
   */
  async searchEURLexByDirectoryCode(directoryCode: string): Promise<EULegalSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/eurlex/directory_code/?dc=${encodeURIComponent(directoryCode)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        documents: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        source: 'eurlex'
      };
    } catch (error) {
      console.error('Error searching EUR-Lex by directory code:', error);
      return { documents: [], total: 0, source: 'eurlex' };
    }
  }
  
  /**
   * Get a specific EUR-Lex document by ID
   * @param id - The document ID
   * @returns Promise<EULegalDocument | null>
   */
  async getEURLexDocument(id: string): Promise<EULegalDocument | null> {
    try {
      const response = await fetch(`${this.baseUrl}/eurlex/document/?id=${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error getting EUR-Lex document:', error);
      return null;
    }
  }
  
  /**
   * Search PreLex documents by form
   * @param form - The form of legal act
   * @returns Promise<EULegalSearchResult>
   */
  async searchPrelexByForm(form: string): Promise<EULegalSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/prelex/form/?f=${encodeURIComponent(form)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        documents: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        source: 'prelex'
      };
    } catch (error) {
      console.error('Error searching PreLex by form:', error);
      return { documents: [], total: 0, source: 'prelex' };
    }
  }
  
  /**
   * Search PreLex documents by responsible DG
   * @param dg - The Directorate General (e.g., 'DG Environment')
   * @returns Promise<EULegalSearchResult>
   */
  async searchPrelexByDG(dg: string): Promise<EULegalSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/prelex/dg_responsible/?dg=${encodeURIComponent(dg)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        documents: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        source: 'prelex'
      };
    } catch (error) {
      console.error('Error searching PreLex by DG:', error);
      return { documents: [], total: 0, source: 'prelex' };
    }
  }
  
  /**
   * Search PreLex documents by procedure
   * @param procedure - The legislative procedure
   * @returns Promise<EULegalSearchResult>
   */
  async searchPrelexByProcedure(procedure: string): Promise<EULegalSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/prelex/procedure/?p=${encodeURIComponent(procedure)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        documents: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        source: 'prelex'
      };
    } catch (error) {
      console.error('Error searching PreLex by procedure:', error);
      return { documents: [], total: 0, source: 'prelex' };
    }
  }
  
  /**
   * Get Council voting results by year
   * @param year - The year (e.g., '2011')
   * @returns Promise<EULegalSearchResult>
   */
  async getCouncilVotesByYear(year: string): Promise<EULegalSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/council/year/?y=${encodeURIComponent(year)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        documents: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        source: 'council'
      };
    } catch (error) {
      console.error('Error getting Council votes by year:', error);
      return { documents: [], total: 0, source: 'council' };
    }
  }
  
  /**
   * Get Council voting results by country
   * @param countryId - The country ID
   * @returns Promise<EULegalSearchResult>
   */
  async getCouncilVotesByCountry(countryId: string): Promise<EULegalSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/council/country/?id=${encodeURIComponent(countryId)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        documents: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        source: 'council'
      };
    } catch (error) {
      console.error('Error getting Council votes by country:', error);
      return { documents: [], total: 0, source: 'council' };
    }
  }
  
  /**
   * Smart search across multiple sources based on search terms
   * @param searchTerms - Array of search terms to look for
   * @param maxResults - Maximum number of results to return (default: 10)
   * @returns Promise<EULegalSearchResult[]>
   */
  async smartSearch(searchTerms: string[], maxResults: number = 10): Promise<EULegalSearchResult[]> {
    const results: EULegalSearchResult[] = [];
    
    try {
      // Try to identify the type of search based on terms
      const hasDirective = searchTerms.some(term => /directive/i.test(term));
      const hasRegulation = searchTerms.some(term => /regulation/i.test(term));
      const hasDecision = searchTerms.some(term => /decision/i.test(term));
      const hasProcurement = searchTerms.some(term => /procurement|tender/i.test(term));
      const hasConsumer = searchTerms.some(term => /consumer|protection/i.test(term));
      
      // Search EUR-Lex by form if we detect legal act types
      if (hasDirective) {
        const directiveResults = await this.searchEURLexByForm('Directive');
        if (directiveResults.total > 0) {
          directiveResults.documents = directiveResults.documents.slice(0, maxResults);
          results.push(directiveResults);
        }
      }
      
      if (hasRegulation) {
        const regulationResults = await this.searchEURLexByForm('Regulation');
        if (regulationResults.total > 0) {
          regulationResults.documents = regulationResults.documents.slice(0, maxResults);
          results.push(regulationResults);
        }
      }
      
      if (hasDecision) {
        const decisionResults = await this.searchEURLexByForm('Decision');
        if (decisionResults.total > 0) {
          decisionResults.documents = decisionResults.documents.slice(0, maxResults);
          results.push(decisionResults);
        }
      }
      
      // Search by domain-specific terms
      if (hasProcurement) {
        // Search for procurement-related directory codes (though we'd need to know the specific codes)
        // For now, search by European Commission as author since they handle most procurement legislation
        const procurementResults = await this.searchEURLexByAuthor('European Commission');
        if (procurementResults.total > 0) {
          procurementResults.documents = procurementResults.documents
            .filter(doc => doc.title && /procurement|tender/i.test(doc.title))
            .slice(0, maxResults);
          if (procurementResults.documents.length > 0) {
            procurementResults.total = procurementResults.documents.length;
            results.push(procurementResults);
          }
        }
      }
      
      if (hasConsumer) {
        // Search for consumer protection legislation
        const consumerResults = await this.searchEURLexByAuthor('European Commission');
        if (consumerResults.total > 0) {
          consumerResults.documents = consumerResults.documents
            .filter(doc => doc.title && /consumer|protection/i.test(doc.title))
            .slice(0, maxResults);
          if (consumerResults.documents.length > 0) {
            consumerResults.total = consumerResults.documents.length;
            results.push(consumerResults);
          }
        }
      }
      
    } catch (error) {
      console.error('Error in smart search:', error);
    }
    
    return results;
  }
}