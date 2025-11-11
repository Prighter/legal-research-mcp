import { EULegalDocument } from './EULegalAPIClient.js';

/**
 * CitationFormatter class for formatting and extracting legal citations
 */
export class CitationFormatter {
  // Regular expressions for detecting different types of citations
  private citationPatterns: Record<string, RegExp> = {
    law: /(?:Law|Legea)\s+(?:No\.\s*)?(\d+(?:\/\d+)?)/i,
    article: /(?:Art(?:icle|icolul)?\.?\s+)(\d+(?:\(\d+\))?(?:\s*[a-z])?)/i,
    decision: /(?:Decision|Decizia|ANSC\s+Decision)\s+(?:No\.\s*)?#?(\d+(?:\/\d+)?)/i,
    caseNumber: /#(\d+)/i,
    directive: /(?:Directive|Directiva)\s+(?:No\.\s*)?(\d+(?:\/\d+)?\/[A-Z]+)/i,
    regulation: /(?:Regulation|Regulament)\s+(?:No\.\s*)?(\d+(?:\/\d+)?)/i,
    euDirective: /(?:(?:EU\s+)?Directive|Council\s+Directive|Commission\s+Directive)\s+(\d{4}\/\d+\/E[UC])/i,
    euRegulation: /(?:(?:EU\s+)?Regulation|Council\s+Regulation|Commission\s+Regulation)\s+(?:No\.\s*)?(\d+\/\d+)/i,
    civilCode: /(?:Civil\s+Code|Codul\s+Civil)/i,
    celexNumber: /(\d{1,2})(\d{4})([A-Z])(\d{4})/i
  };

  /**
   * Formats a legal citation according to standards
   * @param citation - The citation text to format
   * @param domain - The legal domain for context
   * @returns Formatted citation
   */
  public formatLegalCitation(citation: string, domain: string): string {
    // Format based on domain and citation type
    if (domain === "ansc_contestation") {
      // Format ANSC-specific citations
      citation = this.formatAnscCitation(citation);
    } else if (domain === "consumer_protection") {
      // Format consumer protection citations
      citation = this.formatConsumerCitation(citation);
    } else if (domain === "contract_analysis") {
      // Format contract-related citations
      citation = this.formatContractCitation(citation);
    }
    
    return citation;
  }
  
  /**
   * Extracts potential citations from text
   * @param text - The text to analyze
   * @returns Array of extracted citations
   */
  public extractCitations(text: string): string[] {
    const citations: string[] = [];
    
    // Check for law citations
    const lawMatches = text.match(new RegExp(this.citationPatterns.law.source, 'gi'));
    if (lawMatches) {
      citations.push(...lawMatches);
    }
    
    // Check for article citations
    const articleMatches = text.match(new RegExp(this.citationPatterns.article.source, 'gi'));
    if (articleMatches) {
      citations.push(...articleMatches);
    }
    
    // Check for decision citations
    const decisionMatches = text.match(new RegExp(this.citationPatterns.decision.source, 'gi'));
    if (decisionMatches) {
      citations.push(...decisionMatches);
    }
    
    // Check for case number citations
    const caseMatches = text.match(new RegExp(this.citationPatterns.caseNumber.source, 'gi'));
    if (caseMatches) {
      citations.push(...caseMatches);
    }
    
    // Check for directive citations
    const directiveMatches = text.match(new RegExp(this.citationPatterns.directive.source, 'gi'));
    if (directiveMatches) {
      citations.push(...directiveMatches);
    }
    
    // Check for Civil Code citations
    const civilCodeMatches = text.match(new RegExp(this.citationPatterns.civilCode.source, 'gi'));
    if (civilCodeMatches) {
      citations.push(...civilCodeMatches);
    }
    
    // Remove duplicates and return
    return [...new Set(citations)];
  }
  
  /**
   * Formats ANSC-specific citations
   * @param citation - The citation to format
   * @returns Formatted citation
   */
  private formatAnscCitation(citation: string): string {
    // Format Law 131/2015 citations
    if (citation.match(/Law\s+131\/2015/i)) {
      citation = citation.replace(/Law\s+131\/2015/i, "Law No. 131/2015 on Public Procurement");
    }
    
    // Format ANSC decision citations
    const decisionMatch = citation.match(/ANSC\s+Decision\s+#?(\d+)(?:\/(\d+))?/i);
    if (decisionMatch) {
      const decisionNumber = decisionMatch[1];
      const year = decisionMatch[2] || new Date().getFullYear();
      citation = citation.replace(/ANSC\s+Decision\s+#?(\d+)(?:\/(\d+))?/i, `ANSC Decision No. ${decisionNumber}/${year}`);
    }
    
    // Format EU directive citations
    const directiveMatch = citation.match(/Directive\s+(\d+)\/(\d+)\/([A-Z]+)/i);
    if (directiveMatch) {
      const [_, number, year, org] = directiveMatch;
      citation = citation.replace(/Directive\s+(\d+)\/(\d+)\/([A-Z]+)/i, `${org} Directive ${number}/${year}`);
    }
    
    return citation;
  }
  
  /**
   * Formats consumer protection citations
   * @param citation - The citation to format
   * @returns Formatted citation
   */
  private formatConsumerCitation(citation: string): string {
    // Format Consumer Protection Law citations
    if (citation.match(/Consumer\s+Protection\s+Law/i)) {
      citation = citation.replace(/Consumer\s+Protection\s+Law/i, "Consumer Protection Law");
    }
    
    // Format case citations
    const caseMatch = citation.match(/Case\s+#?(\d+)(?:\/(\d+))?/i);
    if (caseMatch) {
      const caseNumber = caseMatch[1];
      const year = caseMatch[2] || new Date().getFullYear();
      citation = citation.replace(/Case\s+#?(\d+)(?:\/(\d+))?/i, `Case No. ${caseNumber}/${year}`);
    }
    
    return citation;
  }
  
  /**
   * Formats contract-related citations
   * @param citation - The citation to format
   * @returns Formatted citation
   */
  private formatContractCitation(citation: string): string {
    // Format Civil Code citations
    if (citation.match(/Civil\s+Code/i)) {
      citation = citation.replace(/Civil\s+Code/i, "Civil Code");
    }
    
    // Format article citations
    const articleMatch = citation.match(/Art(?:icle)?\.?\s+(\d+)(?:\((\d+)\))?(?:\s+([a-z]))?/i);
    if (articleMatch) {
      const [_, article, paragraph, point] = articleMatch;
      let formattedCitation = `Article ${article}`;
      
      if (paragraph) {
        formattedCitation += `, paragraph (${paragraph})`;
      }
      
      if (point) {
        formattedCitation += `, point ${point})`;
      }
      
      citation = citation.replace(/Art(?:icle)?\.?\s+(\d+)(?:\((\d+)\))?(?:\s+([a-z]))?/i, formattedCitation);
    }
    
    return citation;
  }
  
  /**
   * Formats EU legal document with proper citation and links
   * @param document - The EU legal document
   * @returns Formatted citation with links
   */
  public formatEULegalDocumentCitation(document: EULegalDocument): string {
    let citation = '';
    let title = document.title || 'Untitled Document';
    
    // Format based on document form
    if (document.form) {
      const form = document.form.toLowerCase();
      
      if (form.includes('directive')) {
        citation = this.formatEUDirectiveCitation(document);
      } else if (form.includes('regulation')) {
        citation = this.formatEURegulationCitation(document);
      } else if (form.includes('decision')) {
        citation = this.formatEUDecisionCitation(document);
      } else {
        citation = this.formatGenericEUDocumentCitation(document);
      }
    } else {
      citation = this.formatGenericEUDocumentCitation(document);
    }
    
    return citation;
  }
  
  /**
   * Formats EU Directive citation with link
   * @param document - The directive document
   * @returns Formatted directive citation
   */
  private formatEUDirectiveCitation(document: EULegalDocument): string {
    let citation = '';
    
    if (document.author && document.date) {
      const year = new Date(document.date).getFullYear();
      
      // Extract directive number from CELEX or title
      let directiveNumber = '';
      if (document.celex_number) {
        const celexMatch = document.celex_number.match(/(\d{4})L(\d{4})/);
        if (celexMatch) {
          directiveNumber = `${celexMatch[2]}/${celexMatch[1]}`;
        }
      }
      
      // Build citation
      citation = `${document.author} Directive`;
      if (directiveNumber) {
        citation += ` ${directiveNumber}`;
      }
      citation += ` of ${new Date(document.date).toLocaleDateString('en-GB')}`;
      
      if (document.title) {
        // Clean and shorten title
        let title = document.title.replace(/^(Council|Commission|European Parliament|Parliament and Council)\s*(Directive|Decision|Regulation)\s*/i, '');
        if (title.length > 100) {
          title = title.substring(0, 97) + '...';
        }
        citation += ` (${title})`;
      }
    } else {
      citation = document.title || 'EU Directive';
    }
    
    // Add link if available
    if (document.url) {
      citation += ` [EUR-Lex](${document.url})`;
    } else if (document.celex_number) {
      const eurlexUrl = `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${document.celex_number}`;
      citation += ` [EUR-Lex](${eurlexUrl})`;
    }
    
    return citation;
  }
  
  /**
   * Formats EU Regulation citation with link
   * @param document - The regulation document
   * @returns Formatted regulation citation
   */
  private formatEURegulationCitation(document: EULegalDocument): string {
    let citation = '';
    
    if (document.author && document.date) {
      const year = new Date(document.date).getFullYear();
      
      // Extract regulation number from CELEX or title
      let regulationNumber = '';
      if (document.celex_number) {
        const celexMatch = document.celex_number.match(/(\d{4})R(\d{4})/);
        if (celexMatch) {
          regulationNumber = `${celexMatch[2]}/${celexMatch[1]}`;
        }
      }
      
      // Build citation
      citation = `${document.author} Regulation`;
      if (regulationNumber) {
        citation += ` (EU) No ${regulationNumber}`;
      }
      citation += ` of ${new Date(document.date).toLocaleDateString('en-GB')}`;
      
      if (document.title) {
        // Clean and shorten title
        let title = document.title.replace(/^(Council|Commission|European Parliament|Parliament and Council)\s*(Directive|Decision|Regulation)\s*/i, '');
        if (title.length > 100) {
          title = title.substring(0, 97) + '...';
        }
        citation += ` (${title})`;
      }
    } else {
      citation = document.title || 'EU Regulation';
    }
    
    // Add link if available
    if (document.url) {
      citation += ` [EUR-Lex](${document.url})`;
    } else if (document.celex_number) {
      const eurlexUrl = `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${document.celex_number}`;
      citation += ` [EUR-Lex](${eurlexUrl})`;
    }
    
    return citation;
  }
  
  /**
   * Formats EU Decision citation with link
   * @param document - The decision document
   * @returns Formatted decision citation
   */
  private formatEUDecisionCitation(document: EULegalDocument): string {
    let citation = '';
    
    if (document.author && document.date) {
      citation = `${document.author} Decision of ${new Date(document.date).toLocaleDateString('en-GB')}`;
      
      if (document.title) {
        // Clean and shorten title
        let title = document.title.replace(/^(Council|Commission|European Parliament|Parliament and Council)\s*(Directive|Decision|Regulation)\s*/i, '');
        if (title.length > 100) {
          title = title.substring(0, 97) + '...';
        }
        citation += ` (${title})`;
      }
    } else {
      citation = document.title || 'EU Decision';
    }
    
    // Add link if available
    if (document.url) {
      citation += ` [EUR-Lex](${document.url})`;
    } else if (document.celex_number) {
      const eurlexUrl = `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${document.celex_number}`;
      citation += ` [EUR-Lex](${eurlexUrl})`;
    }
    
    return citation;
  }
  
  /**
   * Formats generic EU document citation with link
   * @param document - The document
   * @returns Formatted generic citation
   */
  private formatGenericEUDocumentCitation(document: EULegalDocument): string {
    let citation = '';
    
    if (document.title) {
      citation = document.title;
      if (citation.length > 150) {
        citation = citation.substring(0, 147) + '...';
      }
    } else {
      citation = 'EU Legal Document';
    }
    
    if (document.author) {
      citation += ` (${document.author})`;
    }
    
    if (document.date) {
      citation += ` (${new Date(document.date).getFullYear()})`;
    }
    
    // Add link if available
    if (document.url) {
      citation += ` [EUR-Lex](${document.url})`;
    } else if (document.celex_number) {
      const eurlexUrl = `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${document.celex_number}`;
      citation += ` [EUR-Lex](${eurlexUrl})`;
    }
    
    return citation;
  }
  
  /**
   * Creates a formatted citation list from multiple EU documents
   * @param documents - Array of EU legal documents
   * @param title - Title for the citation list
   * @returns Formatted citation list with proper numbering
   */
  public createEUCitationList(documents: EULegalDocument[], title: string = 'Legal References'): string {
    if (documents.length === 0) {
      return '';
    }
    
    let citationList = `## ${title}\n\n`;
    
    documents.forEach((document, index) => {
      const citation = this.formatEULegalDocumentCitation(document);
      citationList += `${index + 1}. ${citation}\n`;
    });
    
    return citationList;
  }
  
  /**
   * Creates inline citations for text with EU document references
   * @param text - The text containing references
   * @param documents - Array of EU legal documents to cite
   * @returns Text with inline citations added
   */
  public addInlineCitations(text: string, documents: EULegalDocument[]): string {
    if (documents.length === 0) {
      return text;
    }
    
    let citedText = text;
    
    documents.forEach((document, index) => {
      const citationNumber = `[${index + 1}]`;
      
      // Look for mentions of this document in the text
      if (document.title) {
        // Try to match partial titles or key terms
        const titleWords = document.title.split(' ').filter(word => word.length > 3);
        for (const word of titleWords) {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          if (regex.test(citedText) && !citedText.includes(citationNumber)) {
            citedText = citedText.replace(regex, match => `${match} ${citationNumber}`);
            break; // Only add citation once per document
          }
        }
      }
      
      // Try to match by form and approximate date/number
      if (document.form && document.date) {
        const year = new Date(document.date).getFullYear();
        const formRegex = new RegExp(`\\b${document.form}\\s*(?:(?:No\\.?\\s*)?\\d+(?:/\\d+)?)?\\s*(?:of\\s+)?(?:${year})?`, 'gi');
        if (formRegex.test(citedText) && !citedText.includes(citationNumber)) {
          citedText = citedText.replace(formRegex, match => `${match} ${citationNumber}`);
        }
      }
    });
    
    // Add citation list at the end
    citedText += '\n\n' + this.createEUCitationList(documents);
    
    return citedText;
  }
  
  /**
   * Extracts EUR-Lex URL from CELEX number
   * @param celexNumber - The CELEX number
   * @returns EUR-Lex URL
   */
  public getCELEXUrl(celexNumber: string): string {
    return `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celexNumber}`;
  }
  
  /**
   * Validates and formats CELEX number
   * @param celexNumber - The CELEX number to validate
   * @returns Formatted CELEX number or null if invalid
   */
  public validateCELEXNumber(celexNumber: string): string | null {
    const celexMatch = celexNumber.match(this.citationPatterns.celexNumber);
    if (celexMatch) {
      const [_, sector, year, type, number] = celexMatch;
      return `${sector.padStart(2, '0')}${year}${type}${number.padStart(4, '0')}`;
    }
    return null;
  }
  
  /**
   * Adds a new citation pattern
   * @param name - The pattern name
   * @param pattern - The RegExp pattern
   */
  public addCitationPattern(name: string, pattern: RegExp): void {
    this.citationPatterns[name] = pattern;
  }
}