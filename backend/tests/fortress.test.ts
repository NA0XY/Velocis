// tests/fortress.test.ts
// Unit tests for the Fortress dual-purpose engine
// Tests: generateQATestPlan, generateAPIDocs
// Uses mocked AWS Bedrock Converse API — no real AWS calls

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// ─────────────────────────────────────────────
// MOCKS — Set up before any imports that use them
// ─────────────────────────────────────────────

// Mock the Bedrock Converse API — capture calls and control responses
const mockSend = jest.fn();
jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  ConverseCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
}));

// ─────────────────────────────────────────────
// IMPORTS — After mocks are set up
// ─────────────────────────────────────────────

import {
  generateQATestPlan,
  generateAPIDocs,
} from "../src/functions/fortress/analyzeFortress";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

// ─────────────────────────────────────────────
// TEST FIXTURES
// ─────────────────────────────────────────────

const MOCK_MARKDOWN_QA_PLAN = `
# QA Test Plan

## Edge Cases
- Empty email field
- Password shorter than 8 characters

## Security Considerations
- SQL injection via email field
- Brute-force on password

## BDD Scenarios

### Scenario 1: Successful registration
**Given** a valid email and password  
**When** POST /api/users is called  
**Then** a 201 response with a JWT token is returned

### Scenario 2: Duplicate email
**Given** an email that already exists in the database  
**When** POST /api/users is called  
**Then** a 409 Conflict response is returned

### Scenario 3: Invalid email format
**Given** a malformed email address  
**When** POST /api/users is called  
**Then** a 400 Bad Request with validation errors is returned
`.trim();

const MOCK_MARKDOWN_API_DOCS = `
# API Reference

## POST /api/users

Creates a new user account.

### Request Body
| Field    | Type   | Required | Description              |
|----------|--------|----------|--------------------------|
| email    | string | Yes      | Valid email address       |
| password | string | Yes      | Minimum 8 characters     |

### Responses
| Status | Description                         |
|--------|-------------------------------------|
| 201    | User created, returns JWT token     |
| 400    | Validation error                    |
| 409    | Email already in use                |
| 500    | Internal server error               |
`.trim();

/** Build a well-formed Bedrock ConverseCommand response */
function buildMockConverseResponse(text: string) {
  return {
    output: {
      message: {
        role: "assistant",
        content: [{ text }],
      },
    },
    stopReason: "end_turn",
    usage: { inputTokens: 400, outputTokens: 300, totalTokens: 700 },
  };
}

const MOCK_EXPRESS_ROUTE = `
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser } from '../services/userService';

const router = express.Router();

router.post(
  '/api/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use.' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await createUser({ email, password: hashedPassword });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: { userId: user.id, email: user.email, token },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  }
);

export default router;
`.trim();

// ─────────────────────────────────────────────
// generateQATestPlan
// ─────────────────────────────────────────────

describe("Fortress: generateQATestPlan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue(buildMockConverseResponse(MOCK_MARKDOWN_QA_PLAN));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Happy Path ──────────────────────────────────────────────────────────

  it("should return a non-empty Markdown string", async () => {
    const result = await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return the text content from Bedrock's response", async () => {
    const result = await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    expect(result).toBe(MOCK_MARKDOWN_QA_PLAN);
  });

  it("should invoke BedrockRuntimeClient.send exactly once", async () => {
    await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("should pass the source code as the user message", async () => {
    await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const userMessage = converseInput.messages?.[0];
    expect(userMessage?.role).toBe("user");
    expect(userMessage?.content?.[0]?.text).toContain(MOCK_EXPRESS_ROUTE);
  });

  it("should use the QA Strategist system prompt", async () => {
    await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const systemText = converseInput.system?.[0]?.text ?? "";
    expect(systemText.toLowerCase()).toContain("qa strategist");
    expect(systemText.toLowerCase()).toContain("bdd");
    expect(systemText.toLowerCase()).toContain("given");
    expect(systemText.toLowerCase()).toContain("when");
    expect(systemText.toLowerCase()).toContain("then");
  });

  it("should target the amazon.nova-pro-v1:0 model", async () => {
    await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    expect(converseInput.modelId).toBe("amazon.nova-pro-v1:0");
  });

  it("should set inferenceConfig maxTokens to 1500", async () => {
    await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    expect(converseInput.inferenceConfig?.maxTokens).toBe(1500);
  });

  it("should set inferenceConfig temperature to 0.2", async () => {
    await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    expect(converseInput.inferenceConfig?.temperature).toBe(0.2);
  });

  it("should instruct the model NOT to write executable code", async () => {
    await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const systemText = converseInput.system?.[0]?.text ?? "";
    expect(systemText).toMatch(/do not write executable code/i);
  });

  it("should instruct the model to format output as Markdown", async () => {
    await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const systemText = converseInput.system?.[0]?.text ?? "";
    expect(systemText.toLowerCase()).toContain("markdown");
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  it("should handle an empty codeContent string without throwing", async () => {
    await expect(generateQATestPlan("")).resolves.toBeDefined();
  });

  it("should handle very large code content", async () => {
    const largeCode = MOCK_EXPRESS_ROUTE.repeat(50);

    await expect(generateQATestPlan(largeCode)).resolves.toBeDefined();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  // ── Empty / Malformed Response ──────────────────────────────────────────

  it("should return an empty string when Bedrock response has no content blocks", async () => {
    mockSend.mockResolvedValue({
      output: { message: { role: "assistant", content: [] } },
    });

    const result = await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    expect(result).toBe("");
  });

  it("should return an empty string when output.message is missing", async () => {
    mockSend.mockResolvedValue({ output: {} });

    const result = await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    expect(result).toBe("");
  });

  // ── Error Handling ──────────────────────────────────────────────────────

  it("should NOT throw when Bedrock throws — returns a Markdown error message instead", async () => {
    mockSend.mockRejectedValue(new Error("Bedrock throttled"));

    const result = await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should include 'Error' heading in the fallback response", async () => {
    mockSend.mockRejectedValue(new Error("Service unavailable"));

    const result = await generateQATestPlan(MOCK_EXPRESS_ROUTE);

    expect(result).toMatch(/^##?\s+Error/i);
  });

  it("should handle a network timeout gracefully", async () => {
    mockSend.mockRejectedValue(new Error("ETIMEDOUT"));

    await expect(generateQATestPlan(MOCK_EXPRESS_ROUTE)).resolves.not.toThrow();
  });
});

// ─────────────────────────────────────────────
// generateAPIDocs
// ─────────────────────────────────────────────

describe("Fortress: generateAPIDocs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue(buildMockConverseResponse(MOCK_MARKDOWN_API_DOCS));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Happy Path ──────────────────────────────────────────────────────────

  it("should return a non-empty Markdown string", async () => {
    const result = await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return the text content from Bedrock's response", async () => {
    const result = await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    expect(result).toBe(MOCK_MARKDOWN_API_DOCS);
  });

  it("should invoke BedrockRuntimeClient.send exactly once", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("should pass the source code as the user message", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const userMessage = converseInput.messages?.[0];
    expect(userMessage?.role).toBe("user");
    expect(userMessage?.content?.[0]?.text).toContain(MOCK_EXPRESS_ROUTE);
  });

  it("should use the Technical Writer system prompt", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const systemText = converseInput.system?.[0]?.text ?? "";
    expect(systemText.toLowerCase()).toContain("technical writer");
  });

  it("should instruct the model to extract endpoints and HTTP methods", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const systemText = converseInput.system?.[0]?.text ?? "";
    expect(systemText.toLowerCase()).toContain("endpoint");
    expect(systemText.toLowerCase()).toContain("http method");
  });

  it("should instruct the model to document payload structure and responses", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const systemText = converseInput.system?.[0]?.text ?? "";
    expect(systemText.toLowerCase()).toContain("payload");
    expect(systemText.toLowerCase()).toContain("response");
  });

  it("should target the amazon.nova-pro-v1:0 model", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    expect(converseInput.modelId).toBe("amazon.nova-pro-v1:0");
  });

  it("should set inferenceConfig maxTokens to 1500", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    expect(converseInput.inferenceConfig?.maxTokens).toBe(1500);
  });

  it("should set inferenceConfig temperature to 0.2", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    expect(converseInput.inferenceConfig?.temperature).toBe(0.2);
  });

  it("should instruct the model to format output as Markdown for README", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const systemText = converseInput.system?.[0]?.text ?? "";
    expect(systemText.toLowerCase()).toContain("markdown");
    expect(systemText.toLowerCase()).toContain("readme");
  });

  it("should mention fallback for non-API code in the system prompt", async () => {
    await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    const converseInput = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock
      .calls[0][0] as any;

    const systemText = converseInput.system?.[0]?.text ?? "";
    expect(systemText).toMatch(/not.*api|summarize/i);
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  it("should handle an empty codeContent string without throwing", async () => {
    await expect(generateAPIDocs("")).resolves.toBeDefined();
  });

  it("should handle utility (non-route) code without throwing", async () => {
    const utilCode = `
export function stripCodeFences(input: string): string {
  if (!input) return "";
  return input.replace(/\`\`\`[\\w]*\\n?/g, "").trim();
}
    `.trim();

    await expect(generateAPIDocs(utilCode)).resolves.toBeDefined();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  // ── Empty / Malformed Response ──────────────────────────────────────────

  it("should return an empty string when Bedrock response has no content blocks", async () => {
    mockSend.mockResolvedValue({
      output: { message: { role: "assistant", content: [] } },
    });

    const result = await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    expect(result).toBe("");
  });

  it("should return an empty string when output is missing entirely", async () => {
    mockSend.mockResolvedValue({});

    const result = await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    expect(result).toBe("");
  });

  // ── Error Handling ──────────────────────────────────────────────────────

  it("should NOT throw when Bedrock throws — returns a Markdown error message instead", async () => {
    mockSend.mockRejectedValue(new Error("Bedrock throttled"));

    const result = await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should include 'Error' heading in the fallback response", async () => {
    mockSend.mockRejectedValue(new Error("AccessDeniedException"));

    const result = await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    expect(result).toMatch(/^##?\s+Error/i);
  });

  it("should handle a model validation error gracefully", async () => {
    mockSend.mockRejectedValue(new Error("ValidationException: model not found"));

    await expect(generateAPIDocs(MOCK_EXPRESS_ROUTE)).resolves.not.toThrow();
  });
});

// ─────────────────────────────────────────────
// SHARED BEDROCK CLIENT CONFIGURATION
// Validates that both functions use the same correctly configured client
// ─────────────────────────────────────────────

describe("Fortress: Bedrock client configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue(buildMockConverseResponse("# Output"));
  });

  it("should initialise BedrockRuntimeClient with us-east-1 region", () => {
    const MockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;

    // Client is constructed at module load time — check constructor args
    const constructorCalls = MockClient.mock.calls;
    expect(constructorCalls.length).toBeGreaterThan(0);

    const constructorArg = constructorCalls[0][0] as { region?: string };
    expect(constructorArg?.region).toBe("us-east-1");
  });

  it("generateQATestPlan and generateAPIDocs should use ConverseCommand (not InvokeModelCommand)", async () => {
    await generateQATestPlan("code");
    await generateAPIDocs("code");

    const MockConverseCommand = ConverseCommand as jest.MockedClass<typeof ConverseCommand>;
    expect(MockConverseCommand).toHaveBeenCalledTimes(2);
  });

  it("both functions should call client.send() with a ConverseCommand instance", async () => {
    await generateQATestPlan("some code");
    await generateAPIDocs("some code");

    expect(mockSend).toHaveBeenCalledTimes(2);
  });
});

// ─────────────────────────────────────────────
// INDEPENDENT INVOCATION
// Ensures the two functions are fully independent and do not share state
// ─────────────────────────────────────────────

describe("Fortress: function independence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calling generateQATestPlan should not affect generateAPIDocs result", async () => {
    mockSend
      .mockResolvedValueOnce(buildMockConverseResponse(MOCK_MARKDOWN_QA_PLAN))
      .mockResolvedValueOnce(buildMockConverseResponse(MOCK_MARKDOWN_API_DOCS));

    const qaResult = await generateQATestPlan(MOCK_EXPRESS_ROUTE);
    const docsResult = await generateAPIDocs(MOCK_EXPRESS_ROUTE);

    expect(qaResult).toBe(MOCK_MARKDOWN_QA_PLAN);
    expect(docsResult).toBe(MOCK_MARKDOWN_API_DOCS);
    expect(qaResult).not.toBe(docsResult);
  });

  it("both functions can be called concurrently without errors", async () => {
    mockSend
      .mockResolvedValueOnce(buildMockConverseResponse(MOCK_MARKDOWN_QA_PLAN))
      .mockResolvedValueOnce(buildMockConverseResponse(MOCK_MARKDOWN_API_DOCS));

    const [qaResult, docsResult] = await Promise.all([
      generateQATestPlan(MOCK_EXPRESS_ROUTE),
      generateAPIDocs(MOCK_EXPRESS_ROUTE),
    ]);

    expect(qaResult).toBeDefined();
    expect(docsResult).toBeDefined();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("the two functions use different system prompts", async () => {
    mockSend.mockResolvedValue(buildMockConverseResponse("# output"));

    await generateQATestPlan(MOCK_EXPRESS_ROUTE);
    const qaCalls = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock.calls;
    const qaSystemPrompt = (qaCalls[0][0] as any).system?.[0]?.text ?? "";

    jest.clearAllMocks();
    mockSend.mockResolvedValue(buildMockConverseResponse("# output"));

    await generateAPIDocs(MOCK_EXPRESS_ROUTE);
    const docsCalls = (ConverseCommand as jest.MockedClass<typeof ConverseCommand>).mock.calls;
    const docsSystemPrompt = (docsCalls[0][0] as any).system?.[0]?.text ?? "";

    expect(qaSystemPrompt).not.toBe(docsSystemPrompt);
  });
});
