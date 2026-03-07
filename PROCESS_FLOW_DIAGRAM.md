# Velocis - Complete Process Flow Diagram

## System Architecture Overview

This document contains comprehensive Mermaid diagrams showing the complete process flows of the Velocis AI Engineering Platform.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        FE[React Frontend<br/>Vite + TypeScript]
        UI[UI Components<br/>Radix + Tailwind]
    end

    subgraph "API Gateway Layer"
        AG[API Gateway / Express<br/>JWT Auth + CORS]
    end

    subgraph "Application Layer - AI Agents"
        SENTINEL[🛡️ Sentinel Agent<br/>Code Review & Security]
        FORTRESS[🏰 Fortress Agent<br/>QA & Self-Healing Tests]
        CORTEX[🧠 Cortex Agent<br/>Service Topology]
        PREDICTOR[💻 IaC Predictor<br/>Infrastructure Generation]
        WORKSPACE[⚙️ Workspace<br/>AI Code Editor]
    end

    subgraph "Integration Layer"
        GITHUB[GitHub API<br/>OAuth + Webhooks]
        BEDROCK[AWS Bedrock<br/>DeepSeek V3 + Nova Pro]
        TRANSLATE[AWS Translate<br/>Multi-language Support]
        STEPFN[AWS Step Functions<br/>TDD Loop Orchestration]
    end

    subgraph "Data Layer"
        DDB[(DynamoDB<br/>14 Tables)]
    end

    FE --> AG
    UI --> FE
    AG --> SENTINEL
    AG --> FORTRESS
    AG --> CORTEX
    AG --> PREDICTOR
    AG --> WORKSPACE
    
    SENTINEL --> BEDROCK
    SENTINEL --> TRANSLATE
    SENTINEL --> GITHUB
    SENTINEL --> DDB
    
    FORTRESS --> BEDROCK
    FORTRESS --> STEPFN
    FORTRESS --> GITHUB
    FORTRESS --> DDB
    
    CORTEX --> BEDROCK
    CORTEX --> GITHUB
    CORTEX --> DDB
    
    PREDICTOR --> BEDROCK
    PREDICTOR --> GITHUB
    PREDICTOR --> DDB
    
    WORKSPACE --> BEDROCK
    WORKSPACE --> GITHUB
    WORKSPACE --> DDB
    
    GITHUB -.Webhooks.-> AG

    style SENTINEL fill:#8b5cf6
    style FORTRESS fill:#ef4444
    style CORTEX fill:#10b981
    style PREDICTOR fill:#f59e0b
    style WORKSPACE fill:#3b82f6
```

---

## 2. User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant GitHub
    participant DynamoDB

    User->>Frontend: Click "Sign in with GitHub"
    Frontend->>Backend: GET /api/auth/github
    Backend->>GitHub: Redirect to OAuth consent
    GitHub->>User: Show authorization page
    User->>GitHub: Approve access
    GitHub->>Backend: Callback with auth code
    Backend->>GitHub: Exchange code for access token
    GitHub->>Backend: Return access token + user info
    Backend->>DynamoDB: Store user record
    Backend->>Backend: Generate JWT token
    Backend->>Frontend: Set session cookie + redirect
    Frontend->>Backend: GET /api/me (with JWT)
    Backend->>Frontend: Return user profile
    Frontend->>User: Show dashboard
```

---

## 3. Repository Installation & Onboarding Flow

```mermaid
flowchart TD
    START([User Selects Repository]) --> FETCH[Fetch GitHub Repos<br/>GET /api/repos]
    FETCH --> DISPLAY[Display Repository List]
    DISPLAY --> SELECT{User Selects<br/>Repository?}
    SELECT -->|Yes| INSTALL[POST /api/repos/:id/install]
    SELECT -->|No| DISPLAY
    
    INSTALL --> WEBHOOK[Register GitHub Webhook]
    WEBHOOK --> INIT_SENTINEL[Initialize Sentinel Agent]
    INIT_SENTINEL --> INIT_FORTRESS[Provision Fortress QA Loop]
    INIT_FORTRESS --> INIT_CORTEX[Activate Cortex Mapping]
    INIT_CORTEX --> CACHE[Cache Installation Status]
    CACHE --> POLL{Frontend Polls<br/>Install Status}
    
    POLL -->|In Progress| WAIT[Wait 2s]
    WAIT --> POLL
    POLL -->|Complete| SUCCESS[Show Success + Redirect]
    POLL -->|Failed| ERROR[Show Error Message]
    
    SUCCESS --> DASHBOARD[Navigate to Repository Dashboard]
    
    style INSTALL fill:#10b981
    style SUCCESS fill:#22c55e
    style ERROR fill:#ef4444
```

---

## 4. Sentinel Agent - Code Review Workflow

```mermaid
sequenceDiagram
    participant GH as GitHub
    participant Webhook as Webhook Handler
    participant Sentinel as Sentinel Agent
    participant Bedrock as AWS Bedrock<br/>(DeepSeek V3)
    participant Translate as AWS Translate
    participant DDB as DynamoDB
    participant Frontend as Frontend

    GH->>Webhook: Push Event (webhook)
    Webhook->>Webhook: Validate HMAC signature
    Webhook->>Sentinel: analyzeLogic(files, commit)
    
    Sentinel->>GH: Fetch changed file contents
    GH->>Sentinel: Return source code
    
    Sentinel->>Sentinel: Filter reviewable files<br/>(skip tests, configs)
    Sentinel->>Sentinel: Build system prompt<br/>(review depth: standard)
    
    Sentinel->>Bedrock: Converse API call<br/>DeepSeek V3.2
    Note over Bedrock: Analyze for:<br/>- Security vulnerabilities<br/>- Logic errors<br/>- Scalability issues<br/>- Type safety<br/>- AWS best practices
    
    Bedrock->>Sentinel: Return XML review<br/>(findings + severity)
    
    Sentinel->>Sentinel: Parse XML response<br/>Extract findings
    
    alt Multilingual Output
        Sentinel->>Translate: Translate findings<br/>(EN → HI/TA/TE)
        Translate->>Sentinel: Translated text
    end
    
    Sentinel->>DDB: Store findings<br/>(velocis-sentinel table)
    
    alt PR Review
        Sentinel->>GH: Post PR comment<br/>with findings
    end
    
    Sentinel->>Webhook: Return CodeReviewResult
    Webhook->>DDB: Log activity event
    
    Frontend->>DDB: Poll for updates
    DDB->>Frontend: Return latest findings
    Frontend->>Frontend: Display in Sentinel UI
```

---

## 5. Fortress Agent - Self-Healing QA Pipeline

```mermaid
flowchart TD
    START([GitHub Push Event]) --> DETECT[Detect Code Changes]
    DETECT --> TRIGGER[Trigger Fortress Pipeline]
    
    TRIGGER --> LLAMA[Llama 3: Generate Tests<br/>Based on code changes]
    LLAMA --> EXECUTE[Execute Test Suite]
    
    EXECUTE --> CHECK{Tests Pass?}
    
    CHECK -->|Yes| SUCCESS[✅ Mark as Passing]
    CHECK -->|No| CLAUDE[Claude: Analyze Failures<br/>Root cause analysis]
    
    CLAUDE --> DEEPSEEK[DeepSeek: Generate Fix<br/>Code correction]
    DEEPSEEK --> RERUN[Re-run Tests]
    
    RERUN --> RECHECK{Tests Pass?}
    
    RECHECK -->|Yes| COMMIT[Auto-commit Fix<br/>or Create PR]
    RECHECK -->|No| RETRY{Retry Count<br/>< 3?}
    
    RETRY -->|Yes| CLAUDE
    RETRY -->|No| ALERT[Alert Developer<br/>Manual intervention needed]
    
    SUCCESS --> LOG[Log to DynamoDB<br/>velocis-pipeline-runs]
    COMMIT --> LOG
    ALERT --> LOG
    
    LOG --> NOTIFY[Update Frontend<br/>Pipeline Status]
    
    style SUCCESS fill:#22c55e
    style COMMIT fill:#10b981
    style ALERT fill:#ef4444
```

---

## 6. Fortress TDD Loop - Step Functions Orchestration

```mermaid
stateDiagram-v2
    [*] --> CodePushed: GitHub Push
    
    CodePushed --> LlamaGenerateTest: Step 1
    note right of LlamaGenerateTest
        Llama 3 analyzes code
        Generates test cases
        Duration: ~4.2s
    end note
    
    LlamaGenerateTest --> ExecuteTests: Step 2
    note right of ExecuteTests
        Run test suite
        Capture failures
        Duration: ~2.1s
    end note
    
    ExecuteTests --> TestsPassed: Check Result
    
    TestsPassed --> Success: ✅ All Pass
    TestsPassed --> ClaudeAnalyze: ❌ Failures Detected
    
    ClaudeAnalyze --> DeepSeekFix: Step 3
    note right of ClaudeAnalyze
        Claude analyzes patterns
        Identifies root cause
        Duration: ~3.8s
    end note
    
    DeepSeekFix --> RerunTests: Step 4
    note right of DeepSeekFix
        DeepSeek generates fix
        Applies code changes
        Duration: ~2.5s
    end note
    
    RerunTests --> TestsPassed: Re-check
    
    Success --> [*]: Pipeline Complete
```

---

## 7. Cortex Agent - Service Topology Mapping

```mermaid
flowchart LR
    subgraph "Step 1: Discovery"
        FETCH[Fetch Repo Tree<br/>from GitHub]
        FILTER[Filter Code Files<br/>Skip node_modules, tests]
    end
    
    subgraph "Step 2: Analysis"
        AI[AI Analysis<br/>DeepSeek V3]
        REGEX[Regex Fallback<br/>Extract imports]
        MERGE[Merge Results]
    end
    
    subgraph "Step 3: Graph Building"
        NODES[Build Nodes<br/>File metadata + LOC]
        EDGES[Build Edges<br/>Import relationships]
        HEALTH[Integrate Health<br/>From Fortress]
    end
    
    subgraph "Step 4: Positioning"
        LAYER[Layer Assignment<br/>Infrastructure → Handlers]
        POSITION[3D Coordinates<br/>Radial layout]
    end
    
    subgraph "Step 5: Caching"
        CACHE[(DynamoDB Cache<br/>5-minute TTL)]
    end
    
    FETCH --> FILTER
    FILTER --> AI
    FILTER --> REGEX
    AI --> MERGE
    REGEX --> MERGE
    MERGE --> NODES
    NODES --> EDGES
    EDGES --> HEALTH
    HEALTH --> LAYER
    LAYER --> POSITION
    POSITION --> CACHE
    CACHE --> FRONTEND[Frontend 3D Visualization]
    
    style AI fill:#8b5cf6
    style CACHE fill:#3b82f6
    style FRONTEND fill:#10b981
```

---

## 8. IaC Predictor - Infrastructure Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Predictor
    participant GitHub
    participant Bedrock
    participant Pricing
    participant DDB

    User->>Frontend: Navigate to Infrastructure page
    Frontend->>Backend: GET /api/repos/:id/infrastructure
    Backend->>Predictor: generateIac(repo, env, region)
    
    Predictor->>DDB: Check cache (10-min TTL)
    
    alt Cache Hit
        DDB->>Predictor: Return cached IaC
        Predictor->>Backend: Return result
    else Cache Miss
        Predictor->>GitHub: Fetch changed files
        GitHub->>Predictor: Return source code
        
        Predictor->>Predictor: Detect AWS patterns<br/>(Lambda, DynamoDB, S3, etc.)
        
        par Parallel Processing
            Predictor->>Bedrock: Generate Terraform HCL<br/>(Nova Pro)
            Predictor->>Bedrock: Generate CloudFormation YAML
            Predictor->>Pricing: Fetch service costs<br/>(us-east-1)
        end
        
        Bedrock->>Predictor: Return IaC templates
        Pricing->>Predictor: Return pricing data
        
        Predictor->>Predictor: Build cost forecast<br/>Apply environment multiplier
        Predictor->>Predictor: Parse XML response<br/>Extract templates
        
        Predictor->>DDB: Cache result
        Predictor->>Backend: Return IacGenerationResult
    end
    
    Backend->>Frontend: Return IaC + cost data
    Frontend->>User: Display split-pane UI<br/>Code + Cost Breakdown
```

---

## 9. Workspace - AI Code Editor Flow

```mermaid
flowchart TD
    START([User Opens Workspace]) --> LOAD[Load File Browser]
    LOAD --> FETCH[Fetch Repo Files<br/>GET /workspace/files]
    FETCH --> DISPLAY[Display Monaco Editor]
    
    DISPLAY --> SELECT{User Action?}
    
    SELECT -->|Open File| CONTENT[GET /workspace/files/content]
    CONTENT --> RENDER[Render in Monaco]
    RENDER --> ANNOTATIONS[GET /workspace/annotations]
    ANNOTATIONS --> HIGHLIGHT[Highlight Issues Inline]
    
    SELECT -->|Chat with AI| CHAT[POST /workspace/chat]
    CHAT --> BEDROCK[AWS Bedrock<br/>Sentinel Mentor]
    BEDROCK --> STREAM[Stream Response]
    STREAM --> CHATUI[Display in Chat Panel]
    
    SELECT -->|Edit Code| EDIT[User Edits in Monaco]
    EDIT --> SAVE{Save Changes?}
    SAVE -->|Yes| PUSH[POST /workspace/push]
    PUSH --> GITHUB[Commit to GitHub]
    GITHUB --> WEBHOOK[Trigger Webhook]
    WEBHOOK --> SENTINEL[Sentinel Re-scan]
    
    SELECT -->|Review Codebase| REVIEW[POST /workspace/review]
    REVIEW --> FULLSCAN[Full Codebase Scan]
    FULLSCAN --> RESULTS[Display Review Results]
    
    HIGHLIGHT --> SELECT
    CHATUI --> SELECT
    RESULTS --> SELECT
    SENTINEL --> SELECT
    
    style BEDROCK fill:#8b5cf6
    style GITHUB fill:#000
    style SENTINEL fill:#ef4444
```

---

## 10. Dashboard Aggregation Flow

```mermaid
flowchart TD
    START([User Opens Dashboard]) --> AUTH[Verify JWT Token]
    AUTH --> FETCH[GET /api/dashboard]
    
    FETCH --> PARALLEL{Parallel Queries}
    
    PARALLEL --> Q1[Query velocis-repos<br/>All installed repos]
    PARALLEL --> Q2[Query velocis-activity<br/>Recent events]
    PARALLEL --> Q3[Query velocis-sentinel<br/>Risk scores]
    PARALLEL --> Q4[Query velocis-pipeline-runs<br/>Test status]
    PARALLEL --> Q5[Query velocis-deployments<br/>Recent deploys]
    PARALLEL --> Q6[Query velocis-system-health<br/>Platform metrics]
    
    Q1 --> AGG[Aggregate Results]
    Q2 --> AGG
    Q3 --> AGG
    Q4 --> AGG
    Q5 --> AGG
    Q6 --> AGG
    
    AGG --> COMPUTE[Compute Summary Stats<br/>- Healthy/Warning/Critical counts<br/>- Open risks<br/>- Agents running]
    
    COMPUTE --> SPARKLINES[Generate Commit Sparklines<br/>14-day trend data]
    
    SPARKLINES --> RESPONSE[Build Dashboard Response]
    RESPONSE --> FRONTEND[Render Dashboard UI]
    
    FRONTEND --> CARDS[Repository Cards]
    FRONTEND --> ACTIVITY[Activity Feed]
    FRONTEND --> SYSTEM[System Health Panel]
    
    style AGG fill:#10b981
    style FRONTEND fill:#3b82f6
```

---

## 11. GitHub Webhook Processing

```mermaid
flowchart TD
    WEBHOOK([GitHub Webhook<br/>Push Event]) --> VALIDATE[Verify HMAC Signature<br/>x-hub-signature-256]
    
    VALIDATE --> VALID{Valid?}
    VALID -->|No| REJECT[Return 401 Unauthorized]
    VALID -->|Yes| PARSE[Parse Webhook Payload]
    
    PARSE --> EXTRACT[Extract:<br/>- Repo info<br/>- Commit SHA<br/>- Changed files<br/>- Branch]
    
    EXTRACT --> ROUTE{Route to Agents}
    
    ROUTE --> SENTINEL_CHECK{Code files<br/>changed?}
    SENTINEL_CHECK -->|Yes| SENTINEL[Trigger Sentinel<br/>Code Review]
    
    ROUTE --> FORTRESS_CHECK{Test-relevant<br/>changes?}
    FORTRESS_CHECK -->|Yes| FORTRESS[Trigger Fortress<br/>QA Pipeline]
    
    ROUTE --> CORTEX_CHECK{Architecture<br/>changes?}
    CORTEX_CHECK -->|Yes| CORTEX[Rebuild Cortex<br/>Service Map]
    
    ROUTE --> IAC_CHECK{Infrastructure<br/>changes?}
    IAC_CHECK -->|Yes| PREDICTOR[Generate IaC<br/>Templates]
    
    SENTINEL --> LOG[Log Activity Event]
    FORTRESS --> LOG
    CORTEX --> LOG
    PREDICTOR --> LOG
    
    LOG --> DDB[(DynamoDB<br/>velocis-activity)]
    DDB --> NOTIFY[Notify Frontend<br/>via Polling]
    
    NOTIFY --> DONE[Return 200 OK]
    REJECT --> DONE
    
    style VALIDATE fill:#f59e0b
    style SENTINEL fill:#8b5cf6
    style FORTRESS fill:#ef4444
    style CORTEX fill:#10b981
    style PREDICTOR fill:#3b82f6
```

---

## 12. Data Flow - DynamoDB Tables

```mermaid
erDiagram
    USERS ||--o{ REPOS : installs
    REPOS ||--o{ SENTINEL : has
    REPOS ||--o{ PIPELINE_RUNS : has
    REPOS ||--o{ CORTEX : has
    REPOS ||--o{ ACTIVITY : generates
    REPOS ||--o{ ANNOTATIONS : has
    REPOS ||--o{ WORKSPACE_CHAT : has
    REPOS ||--o{ IAC : has
    REPOS ||--o{ DEPLOYMENTS : has
    
    USERS {
        string userId PK
        string githubId
        string login
        string email
        string avatarUrl
        timestamp createdAt
    }
    
    REPOS {
        string repoId PK
        string userId FK
        string repoName
        string repoOwner
        string visibility
        string language
        timestamp installedAt
    }
    
    SENTINEL {
        string repoId PK
        string commitSha SK
        string overallRisk
        int criticalFindings
        json findings
        timestamp reviewedAt
    }
    
    PIPELINE_RUNS {
        string repoId PK
        string runId SK
        string status
        json steps
        json testResults
        timestamp startedAt
    }
    
    CORTEX {
        string repoId PK
        string graphId SK
        json nodes
        json edges
        string overallHealth
        timestamp generatedAt
    }
    
    ACTIVITY {
        string repoId PK
        timestamp timestamp SK
        string agent
        string message
        string severity
    }
    
    ANNOTATIONS {
        string repoId PK
        string annotationId SK
        string filePath
        int line
        string type
        string message
        json suggestions
    }
    
    WORKSPACE_CHAT {
        string repoId PK
        string messageId SK
        string role
        string content
        timestamp timestamp
    }
    
    IAC {
        string repoId PK
        string commitSha SK
        string terraformCode
        string cloudformationCode
        json costForecast
        timestamp generatedAt
    }
    
    DEPLOYMENTS {
        string repoId PK
        timestamp deployedAt SK
        string environment
        string status
        string commitSha
    }
```

---

## 13. AI Model Selection Strategy

```mermaid
flowchart TD
    START([AI Task Required]) --> CLASSIFY{Task Type?}
    
    CLASSIFY -->|Code Review<br/>Security Analysis| DEEPSEEK[DeepSeek V3.2<br/>via Bedrock Converse]
    CLASSIFY -->|Test Generation<br/>QA Planning| LLAMA[Llama 3<br/>via Bedrock]
    CLASSIFY -->|Failure Analysis<br/>Root Cause| CLAUDE[Claude 3.5 Sonnet<br/>via Bedrock]
    CLASSIFY -->|IaC Generation<br/>Architecture| NOVA[Nova Pro<br/>via Bedrock]
    CLASSIFY -->|Code Explanation<br/>Mentoring| DEEPSEEK
    
    DEEPSEEK --> CONFIG1[Config:<br/>- Temperature: 0.1<br/>- Max Tokens: 4096<br/>- Region: us-east-1]
    
    LLAMA --> CONFIG2[Config:<br/>- Temperature: 0.3<br/>- Max Tokens: 2000<br/>- Focus: Test cases]
    
    CLAUDE --> CONFIG3[Config:<br/>- Temperature: 0.2<br/>- Max Tokens: 2048<br/>- Focus: Analysis]
    
    NOVA --> CONFIG4[Config:<br/>- Temperature: 0.1<br/>- Max Tokens: 8000<br/>- Focus: IaC]
    
    CONFIG1 --> INVOKE[Invoke Bedrock API]
    CONFIG2 --> INVOKE
    CONFIG3 --> INVOKE
    CONFIG4 --> INVOKE
    
    INVOKE --> PARSE[Parse Response]
    PARSE --> CACHE[Cache Result]
    CACHE --> RETURN[Return to Agent]
    
    style DEEPSEEK fill:#8b5cf6
    style LLAMA fill:#10b981
    style CLAUDE fill:#3b82f6
    style NOVA fill:#f59e0b
```

---

## 14. Cost Optimization Flow

```mermaid
flowchart TD
    START([Cost Forecast Request]) --> ENV{Environment?}
    
    ENV -->|Dev| MULT1[Multiplier: 1.0x<br/>Minimal traffic]
    ENV -->|Staging| MULT2[Multiplier: 3.0x<br/>Medium traffic]
    ENV -->|Production| MULT3[Multiplier: 10.0x<br/>High traffic]
    
    MULT1 --> DETECT[Detect AWS Services<br/>from code patterns]
    MULT2 --> DETECT
    MULT3 --> DETECT
    
    DETECT --> PARALLEL{Parallel Pricing Queries}
    
    PARALLEL --> LAMBDA[AWS Pricing API<br/>Lambda costs]
    PARALLEL --> DDB[AWS Pricing API<br/>DynamoDB costs]
    PARALLEL --> S3[AWS Pricing API<br/>S3 costs]
    PARALLEL --> BEDROCK[AWS Pricing API<br/>Bedrock costs]
    PARALLEL --> OTHER[AWS Pricing API<br/>Other services]
    
    LAMBDA --> FALLBACK1{Data Found?}
    DDB --> FALLBACK2{Data Found?}
    S3 --> FALLBACK3{Data Found?}
    BEDROCK --> FALLBACK4{Data Found?}
    OTHER --> FALLBACK5{Data Found?}
    
    FALLBACK1 -->|No| DEFAULT1[Use Fallback Cost]
    FALLBACK2 -->|No| DEFAULT2[Use Fallback Cost]
    FALLBACK3 -->|No| DEFAULT3[Use Fallback Cost]
    FALLBACK4 -->|No| DEFAULT4[Use Fallback Cost]
    FALLBACK5 -->|No| DEFAULT5[Use Fallback Cost]
    
    FALLBACK1 -->|Yes| CALC1[Calculate Monthly Cost]
    FALLBACK2 -->|Yes| CALC2[Calculate Monthly Cost]
    FALLBACK3 -->|Yes| CALC3[Calculate Monthly Cost]
    FALLBACK4 -->|Yes| CALC4[Calculate Monthly Cost]
    FALLBACK5 -->|Yes| CALC5[Calculate Monthly Cost]
    
    DEFAULT1 --> CALC1
    DEFAULT2 --> CALC2
    DEFAULT3 --> CALC3
    DEFAULT4 --> CALC4
    DEFAULT5 --> CALC5
    
    CALC1 --> AGGREGATE[Aggregate Total Cost]
    CALC2 --> AGGREGATE
    CALC3 --> AGGREGATE
    CALC4 --> AGGREGATE
    CALC5 --> AGGREGATE
    
    AGGREGATE --> REGIONAL[Apply Regional Surcharge<br/>Mumbai: +10%<br/>São Paulo: +50%]
    
    REGIONAL --> BREAKDOWN[Build Cost Breakdown<br/>Per-service percentages]
    
    BREAKDOWN --> CONFIDENCE{All Services<br/>Found?}
    CONFIDENCE -->|Yes| HIGH[Confidence: HIGH]
    CONFIDENCE -->|No| MEDIUM[Confidence: MEDIUM]
    
    HIGH --> RETURN[Return CostForecast]
    MEDIUM --> RETURN
    
    style AGGREGATE fill:#10b981
    style RETURN fill:#3b82f6
```

---

## 15. Error Handling & Retry Strategy

```mermaid
flowchart TD
    START([API Request]) --> TRY[Execute Operation]
    
    TRY --> SUCCESS{Success?}
    
    SUCCESS -->|Yes| RETURN[Return Result]
    SUCCESS -->|No| ERROR[Catch Error]
    
    ERROR --> CLASSIFY{Error Type?}
    
    CLASSIFY -->|Rate Limit| BACKOFF[Exponential Backoff<br/>Wait 2^n seconds]
    CLASSIFY -->|Timeout| RETRY1{Retry Count<br/>< 3?}
    CLASSIFY -->|Auth Error| REFRESH[Refresh GitHub Token]
    CLASSIFY -->|Bedrock Error| RETRY2{Retry Count<br/>< 2?}
    CLASSIFY -->|DynamoDB Error| RETRY3{Retry Count<br/>< 3?}
    CLASSIFY -->|Unknown| LOG[Log Error]
    
    BACKOFF --> RETRY1
    
    RETRY1 -->|Yes| TRY
    RETRY1 -->|No| FALLBACK1[Use Cached Data]
    
    REFRESH --> REAUTH[Re-authenticate]
    REAUTH --> TRY
    
    RETRY2 -->|Yes| TRY
    RETRY2 -->|No| FALLBACK2[Use Regex Fallback]
    
    RETRY3 -->|Yes| TRY
    RETRY3 -->|No| FALLBACK3[Return Partial Data]
    
    LOG --> ALERT[Alert Developer]
    ALERT --> FAIL[Return 500 Error]
    
    FALLBACK1 --> RETURN
    FALLBACK2 --> RETURN
    FALLBACK3 --> RETURN
    
    style ERROR fill:#ef4444
    style RETURN fill:#22c55e
    style FAIL fill:#dc2626
```

---

## Summary

This comprehensive process flow diagram covers:

1. **System Architecture** - High-level component interaction
2. **Authentication** - GitHub OAuth flow
3. **Repository Onboarding** - Installation and setup
4. **Sentinel Agent** - AI code review workflow
5. **Fortress Agent** - Self-healing QA pipeline
6. **TDD Loop** - Step Functions orchestration
7. **Cortex Agent** - Service topology mapping
8. **IaC Predictor** - Infrastructure generation
9. **Workspace** - AI code editor
10. **Dashboard** - Data aggregation
11. **Webhooks** - GitHub event processing
12. **Data Model** - DynamoDB schema
13. **AI Strategy** - Model selection logic
14. **Cost Optimization** - Pricing calculation
15. **Error Handling** - Retry and fallback strategies

The Velocis platform is a sophisticated AI-powered engineering system that combines multiple AI models (DeepSeek V3, Llama 3, Claude, Nova Pro) with AWS serverless infrastructure to provide autonomous code review, self-healing tests, architecture visualization, and infrastructure generation capabilities.
