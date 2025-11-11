import { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { DomainDetector } from './DomainDetector.js';
import { CitationFormatter } from './CitationFormatter.js';
import { LegalVerifyWithAPITool } from '../tools/LegalVerifyWithAPITool.js';
import { logger } from '../utils/logger.js';

export type ToolCallResponse = CallToolResult;

const LEGAL_THINK_TOOL: Tool = {
  name: 'legal_think',
  description: `A powerful tool for structured legal reasoning that helps analyze complex legal issues.
This tool provides domain-specific guidance and templates for different legal areas including ANSC contestations, consumer protection, and contract analysis.

When to use this tool:
- Breaking down complex legal problems into structured steps
- Analyzing legal requirements and compliance
- Verifying that all elements of a legal test are addressed
- Building comprehensive legal arguments with proper citations

Key features:
- Automatic detection of legal domains
- Domain-specific guidance and templates
- Support for legal citations and references
- Revision capabilities for refining legal arguments
- Thought quality feedback`,
  inputSchema: {
    type: 'object',
    properties: {
      thought: {
        type: 'string',
        description: 'The main legal reasoning content',
      },
      category: {
        type: 'string',
        enum: [
          'analysis',
          'planning',
          'verification',
          'legal_reasoning',
          'ansc_contestation',
          'consumer_protection',
          'contract_analysis',
        ],
        description: 'Category of legal reasoning (optional, will be auto-detected if not provided)',
      },
      references: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'References to laws, regulations, precedents, or previous thoughts (optional)',
      },
      isRevision: {
        type: 'boolean',
        description: 'Whether this thought revises a previous legal reasoning (optional)',
      },
      revisesThoughtNumber: {
        type: 'integer',
        description: 'The thought number being revised (if isRevision is true)',
      },
      requestGuidance: {
        type: 'boolean',
        description: 'Set to true to receive domain-specific legal guidance',
      },
      requestTemplate: {
        type: 'boolean',
        description: 'Set to true to receive a template for this type of legal reasoning',
      },
      thoughtNumber: {
        type: 'integer',
        description: 'Current thought number',
        minimum: 1,
      },
      totalThoughts: {
        type: 'integer',
        description: 'Estimated total thoughts needed',
        minimum: 1,
      },
      nextThoughtNeeded: {
        type: 'boolean',
        description: 'Whether another thought step is needed',
      },
    },
    required: ['thought', 'thoughtNumber', 'totalThoughts', 'nextThoughtNeeded'],
  },
};

const LEGAL_ASK_FOLLOWUP_QUESTION_TOOL: Tool = {
  name: 'legal_ask_followup_question',
  description: `A specialized tool for asking follow-up questions in legal contexts.
This tool helps gather additional information needed for legal analysis by formulating precise questions with domain-specific options.

When to use this tool:
- When you need additional information to complete a legal analysis
- When clarification is needed on specific legal points
- When gathering evidence or documentation for a legal case
- When exploring alternative legal interpretations

Key features:
- Automatic detection of legal domains
- Domain-specific question suggestions
- Legal terminology formatting
- Structured options for efficient information gathering`,
  inputSchema: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The legal question to ask the user',
      },
      options: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'An array of 2-5 options for the user to choose from (optional)',
      },
      context: {
        type: 'string',
        description: 'Additional context about the legal issue (optional)',
      },
    },
    required: ['question'],
  },
};

const LEGAL_ATTEMPT_COMPLETION_TOOL: Tool = {
  name: 'legal_attempt_completion',
  description: `A specialized tool for presenting legal analysis results and conclusions.
This tool formats legal conclusions with proper structure, extracts and formats citations, and provides a professional legal document format.

When to use this tool:
- When presenting the final results of a legal analysis
- When summarizing legal findings and recommendations
- When providing a structured legal opinion
- When concluding a legal reasoning process

Key features:
- Automatic detection of legal domains
- Proper legal document formatting
- Citation extraction and formatting
- Structured sections for clear communication`,
  inputSchema: {
    type: 'object',
    properties: {
      result: {
        type: 'string',
        description: 'The legal analysis result or conclusion',
      },
      command: {
        type: 'string',
        description: 'A CLI command to execute (optional)',
      },
      context: {
        type: 'string',
        description: 'Additional context about the legal issue (optional)',
      },
    },
    required: ['result'],
  },
};

const LEGAL_VERIFY_WITH_API_TOOL: Tool = {
  name: 'legal_verify_with_api',
  description: `A specialized tool for verifying legal analysis against actual EU legal databases.
This tool cross-references legal findings with official EU legislation, procedures, and precedents using the EU legal API.

When to use this tool:
- When you need to verify legal claims against actual EU legislation
- When checking if cited laws and regulations exist and are current
- When looking for supporting EU legal precedents or procedures
- When ensuring legal analysis is grounded in actual legal sources

Key features:
- Access to EUR-Lex database (138,911 EU legal documents from 1951-2013)
- PreLex inter-institutional procedures database (31,173 documents from 1969-2011)
- Council voting records (590 legislative acts from 2006-2011)
- Smart search across multiple EU legal sources
- Domain-specific search optimization
- Relevance scoring and document filtering

Important limitations:
- Data covers legislation up to 2013 (EUR-Lex) and 2011 (PreLex/Council)
- Recent amendments and new legislation may not be included
- National implementing legislation not covered
- Provides reference material, not legal advice`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The legal question or analysis to verify against EU databases',
      },
      searchTerms: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Specific legal terms to search for (optional, will be auto-extracted if not provided)',
      },
      verificationScope: {
        type: 'string',
        enum: ['eurlex', 'prelex', 'council', 'all'],
        description: 'Which EU databases to search (default: all)',
      },
      maxResults: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        description: 'Maximum number of documents to return (default: 10)',
      },
      includeAnalysis: {
        type: 'boolean',
        description: 'Whether to include analysis and recommendations (default: true)',
      },
    },
    required: ['query'],
  },
};

const DOMAIN_GUIDANCE: Record<string, string> = {
  ansc_contestation: `Guidance for ANSC contestation analysis:
1. Identify the specific procurement law provisions that apply
2. Check if all required information about the contestation is collected
3. Verify compliance with ANSC precedents and legal standards
4. Ensure all elements of the legal test are addressed`,
  consumer_protection: `Guidance for consumer protection analysis:
1. Identify applicable consumer protection laws and regulations
2. Analyze burden of proof requirements for each party
3. Verify compliance with warranty and product safety requirements
4. Ensure all consumer rights have been properly considered`,
  contract_analysis: `Guidance for contract analysis:
1. Identify the applicable Civil Code provisions
2. Analyze the key contractual clauses and their enforceability
3. Check for potential legal issues or ambiguities
4. Ensure all contractual requirements are properly addressed`,
  legal_reasoning: `Guidance for general legal reasoning:
1. Identify the applicable legal framework
2. Analyze the facts in light of relevant legal provisions
3. Consider precedents and established legal principles
4. Evaluate arguments from all parties involved`,
};

interface ThoughtHistoryEntry {
  thought: string;
  category?: string;
  references?: string[];
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  timestamp: Date;
  detectedDomain: string;
  isRevision?: boolean;
  revisesThoughtNumber?: number;
}

export class LegalToolsService {
  private readonly domainDetector = new DomainDetector();
  private readonly citationFormatter = new CitationFormatter();
  private readonly legalVerifyTool = new LegalVerifyWithAPITool(this.domainDetector);
  private readonly thoughtHistory: ThoughtHistoryEntry[] = [];

  listTools(): Tool[] {
    return [
      LEGAL_THINK_TOOL,
      LEGAL_ASK_FOLLOWUP_QUESTION_TOOL,
      LEGAL_ATTEMPT_COMPLETION_TOOL,
      LEGAL_VERIFY_WITH_API_TOOL,
    ];
  }

  async callTool(name: string, args: unknown): Promise<ToolCallResponse> {
    switch (name) {
      case 'legal_think':
        return this.processLegalThink(args);
      case 'legal_ask_followup_question':
        return this.processLegalAskFollowupQuestion(args);
      case 'legal_attempt_completion':
        return this.processLegalAttemptCompletion(args);
      case 'legal_verify_with_api':
        return this.legalVerifyTool.processVerification(args);
      default:
        return this.createTextResponse({ error: `Unknown tool: ${name}` }, true);
    }
  }

  private processLegalThink(input: unknown): ToolCallResponse {
    try {
      const data = input as Record<string, unknown>;

      if (!data.thought || typeof data.thought !== 'string') {
        throw new Error('Invalid thought: must be a string');
      }
      if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
        throw new Error('Invalid thoughtNumber: must be a number');
      }
      if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
        throw new Error('Invalid totalThoughts: must be a number');
      }
      if (typeof data.nextThoughtNeeded !== 'boolean') {
        throw new Error('Invalid nextThoughtNeeded: must be a boolean');
      }

      const domain =
        (typeof data.category === 'string' && data.category) ||
        this.domainDetector.detectDomain(data.thought);

      this.thoughtHistory.push({
        thought: data.thought,
        category: data.category as string,
        references: (data.references as string[]) || [],
        thoughtNumber: data.thoughtNumber,
        totalThoughts: data.totalThoughts,
        nextThoughtNeeded: data.nextThoughtNeeded as boolean,
        timestamp: new Date(),
        detectedDomain: domain,
        isRevision: Boolean(data.isRevision),
        revisesThoughtNumber:
          typeof data.revisesThoughtNumber === 'number'
            ? data.revisesThoughtNumber
            : undefined,
      });

      const guidance =
        data.requestGuidance || data.thoughtNumber === 1
          ? DOMAIN_GUIDANCE[domain] || DOMAIN_GUIDANCE.legal_reasoning
          : undefined;

      const template =
        data.requestTemplate || data.thoughtNumber === 1
          ? `Template for ${domain}`
          : undefined;

      const formattedThought = logger.formatThought(
        data.thought,
        domain,
        data.thoughtNumber,
        data.totalThoughts,
        data.isRevision as boolean,
        data.revisesThoughtNumber as number,
      );
      logger.info('Processed legal_think entry');
      console.error(formattedThought);

      return this.createTextResponse({
        thoughtNumber: data.thoughtNumber,
        totalThoughts: data.totalThoughts,
        nextThoughtNeeded: data.nextThoughtNeeded,
        detectedDomain: domain,
        guidance,
        template,
        thoughtHistoryLength: this.thoughtHistory.length,
      });
    } catch (error) {
      return this.handleToolError(error);
    }
  }

  private processLegalAskFollowupQuestion(input: unknown): ToolCallResponse {
    try {
      const data = input as Record<string, unknown>;
      if (!data.question || typeof data.question !== 'string') {
        throw new Error('Invalid question: must be a string');
      }

      return this.createTextResponse({
        question: data.question,
        options: data.options || [],
        detectedDomain: this.domainDetector.detectDomain(data.question),
      });
    } catch (error) {
      return this.handleToolError(error);
    }
  }

  private processLegalAttemptCompletion(input: unknown): ToolCallResponse {
    try {
      const data = input as Record<string, unknown>;
      if (!data.result || typeof data.result !== 'string') {
        throw new Error('Invalid result: must be a string');
      }

      return this.createTextResponse({
        result: data.result,
        command: data.command,
        detectedDomain: this.domainDetector.detectDomain(data.result),
        formattedCitations: [],
      });
    } catch (error) {
      return this.handleToolError(error);
    }
  }

  private handleToolError(error: unknown): ToolCallResponse {
    return this.createTextResponse(
      {
        error: error instanceof Error ? error.message : String(error),
        status: 'failed',
      },
      true,
    );
  }

  private createTextResponse(payload: unknown, isError = false): ToolCallResponse {
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    return {
      content: [
        {
          type: 'text' as const,
          text,
        },
      ],
      ...(isError ? { isError: true } : {}),
    } as ToolCallResponse;
  }
}

export const LEGAL_TOOLS = [
  LEGAL_THINK_TOOL,
  LEGAL_ASK_FOLLOWUP_QUESTION_TOOL,
  LEGAL_ATTEMPT_COMPLETION_TOOL,
  LEGAL_VERIFY_WITH_API_TOOL,
];
