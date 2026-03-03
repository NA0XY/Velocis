/**
 * analyzeFortress.ts
 * Velocis — Fortress QA Strategist
 *
 * Generates a comprehensive BDD Test Plan from source code using
 * DeepSeek V3 via the Amazon Bedrock Converse API.
 *
 * Model:   deepseek.v3.2
 * Region:  us-east-1
 * Credentials are resolved automatically via the AWS SDK default chain
 * (IAM role in Lambda / environment variables locally).
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
  type Message,
  type SystemContentBlock,
} from "@aws-sdk/client-bedrock-runtime";

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT INITIALISATION
// Credentials are sourced from the AWS default credential chain —
// never hard-coded.
// ─────────────────────────────────────────────────────────────────────────────

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

const DEEPSEEK_MODEL = "deepseek.v3.2";

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const QA_SYSTEM_PROMPT = [
  "You are an elite QA Strategist and Product Manager embedded in a software engineering team.",
  "",
  "You will receive one or more real source files from a codebase.",
  "Each file is clearly delimited with a header in the format:",
  "  === FILE [N/TOTAL]: path/to/file.ext ===",
  "",
  "Produce a comprehensive, actionable Test Plan in clean Markdown using this exact structure:",
  "",
  "1. ## Repository Overview",
  "   One short paragraph describing what this codebase does based on the files provided.",
  "",
  "2. For EACH FILE provided, create a dedicated section headed EXACTLY as:",
  "   ## `path/to/file.ext`",
  "   (Use the exact file path from the delimiter as the Markdown heading.)",
  "   Inside each section include:",
  "   - **Edge Cases** — bullet list of important edge cases specific to this file's logic",
  "   - **Security Considerations** — auth issues, injection risks, missing validation, data exposure, etc.",
  "   - **BDD Scenarios** — write 3–5 scenarios in strict Given / When / Then format,",
  "     each labelled as: **Scenario N:** <descriptive title>",
  "",
  "3. ## Cross-Cutting Concerns",
  "   Integration points, auth flows, and error propagation that span multiple files.",
  "",
  "Rules:",
  "- Do NOT write executable code.",
  "- Every file section must be clearly separated with a horizontal rule (---) below it.",
  "- Format everything in clean, well-structured Markdown.",
].join("\n");

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION — generateQATestPlan
// Role: QA Strategist / BDD Planner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyzes the provided source code and generates a comprehensive BDD Test
 * Plan in Markdown using DeepSeek V3 via the Bedrock Converse API.
 * Identifies edge cases, security loopholes, and 3–5 Given/When/Then scenarios.
 *
 * @param codeContent - Raw source code to analyze (any language/framework).
 * @returns Markdown-formatted BDD test plan.
 */
export async function generateQATestPlan(codeContent: string): Promise<string> {
  const messages: Message[] = [
    {
      role: "user",
      content: [{ text: codeContent }],
    },
  ];

  const system: SystemContentBlock[] = [{ text: QA_SYSTEM_PROMPT }];

  const input: ConverseCommandInput = {
    modelId: DEEPSEEK_MODEL,
    messages,
    system,
    inferenceConfig: {
      maxTokens: 2000,
      temperature: 0.2,
    },
  };

  const command = new ConverseCommand(input);
  const response = await bedrockClient.send(command);

  // Safely extract the text from the response
  const content = response.output?.message?.content;
  if (Array.isArray(content) && content.length > 0) {
    const firstBlock = content[0];
    if ("text" in firstBlock && typeof firstBlock.text === "string") {
      return firstBlock.text;
    }
  }

  return "";
}
