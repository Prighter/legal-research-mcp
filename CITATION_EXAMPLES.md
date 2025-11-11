# Enhanced Citation System Examples

This document demonstrates the enhanced citation system that automatically creates properly formatted citations with direct links to EU legal sources.

## 1. Auto-Generated Citation Format

When the `legal_verify_with_api` tool finds EU legal documents, it automatically formats them with:

### EU Directives
```
European Commission Directive 2004/17/EC of 31 March 2004 (coordinating the procurement procedures of entities operating in the water, energy, transport and postal services sectors) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0017)
```

### EU Regulations  
```
Commission Regulation (EU) No 1234/2009 of 15 December 2009 (concerning the application of Articles 87 and 88 of the EC Treaty to aid in the form of guarantees) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1234)
```

### EU Decisions
```
Council Decision of 25 June 2008 (concerning the conclusion of the Agreement between the European Community and the Swiss Confederation) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32008D0142)
```

## 2. Inline Citations in Analysis

The system can automatically add inline citations to legal analysis text:

### Input Text:
```
"The procurement directive requires transparent procedures for public contracts. 
EU regulations mandate specific publication requirements for tender notices."
```

### Output with Inline Citations:
```
"The procurement directive [1] requires transparent procedures for public contracts. 
EU regulations [2] mandate specific publication requirements for tender notices.

## Relevant EU Legal Sources

1. European Commission Directive 2004/17/EC of 31 March 2004 (coordinating the procurement procedures of entities operating in the water, energy, transport and postal services sectors) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0017)

2. Commission Regulation (EU) No 1234/2009 of 15 December 2009 (concerning the application of Articles 87 and 88 of the EC Treaty to aid in the form of guarantees) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1234)
"
```

## 3. Citation List Generation

The system creates numbered citation lists with proper legal formatting:

```markdown
## Relevant EU Legal Sources

1. Council Directive 2004/18/EC of 31 March 2004 (on the coordination of procedures for the award of public works contracts, public supply contracts and public service contracts) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0018)

2. Commission Regulation (EC) No 1564/2005 of 7 September 2005 (establishing standard forms for the publication of notices in the framework of public procurement procedures) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32005R1564)

3. Commission Decision 2005/15/EC of 7 January 2005 (establishing the European Electronic Communications Committee) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32005D0015)
```

## 4. CELEX Number Integration

The system automatically generates EUR-Lex URLs from CELEX numbers:

```javascript
// Input CELEX number: "32004L0018"
// Generated URL: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0018"
```

## 5. Legal Verification Response Structure

The enhanced `legal_verify_with_api` tool now returns:

```json
{
  "query": "EU procurement directive technical specifications requirements",
  "detectedDomain": "ansc_contestation",
  "verification_summary": "Found 15 relevant documents across 2 EU legal sources (eurlex, prelex). Key directives include Directive 2004/18/EC (2004), Directive 2004/17/EC (2004). For procurement contestation analysis, ensure compliance with EU public procurement directives and their national implementation.",
  "recommendations": [
    "Cross-reference with national procurement law implementing these directives",
    "Focus on the procurement directives found in the search results for framework analysis"
  ],
  "limitations": [
    "EU legal database covers legislation up to 2013 for EUR-Lex and 2011 for PreLex",
    "Recent amendments, new legislation, and ECJ rulings may not be included"
  ],
  "formatted_citations": "## Relevant EU Legal Sources\n\n1. Council Directive 2004/18/EC of 31 March 2004 (on the coordination of procedures for the award of public works contracts) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0018)\n\n2. Council Directive 2004/17/EC of 31 March 2004 (coordinating the procurement procedures of entities operating in the water, energy, transport and postal services sectors) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0017)",
  "inline_citations_text": "Found 15 relevant documents across 2 EU legal sources (eurlex, prelex). Key directives [1] include Directive 2004/18/EC (2004), Directive 2004/17/EC [2] (2004).\n\n## Relevant EU Legal Sources\n\n1. Council Directive 2004/18/EC... [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0018)\n\n2. Council Directive 2004/17/EC... [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0017)"
}
```

## 6. Usage in Legal Work

### For ANSC Contestations:
- Links directly to relevant procurement directives
- References specific technical specification requirements
- Provides immediate access to legal text for verification

### For Consumer Protection:
- Links to consumer rights directives and regulations
- References product safety requirements
- Provides warranty and guarantee legal framework

### For Contract Analysis:
- Links to unfair contract terms regulations
- References Rome I Regulation for international contracts
- Provides Civil Code implementation guidance

## Benefits

✅ **Direct Source Access**: Click to view actual legal documents  
✅ **Proper Legal Format**: Standard citation format for professional use  
✅ **Auto-Generated**: No manual citation formatting required  
✅ **Verified Sources**: Only links to official EU legal databases  
✅ **Time-Stamped**: Includes dates and document numbers for accuracy  
✅ **Professional Quality**: Suitable for legal briefs and analysis  

## Integration with Legal Tools

The citation system integrates seamlessly with all legal reasoning tools:

- `legal_think`: Enhanced with automatic citation detection
- `legal_verify_with_api`: Primary citation generation tool
- `legal_attempt_completion`: Includes formatted citations in final reports
- `legal_ask_followup_question`: Suggests questions about cited sources

This ensures that every legal analysis is properly backed by verifiable sources with direct access to the original legislation.