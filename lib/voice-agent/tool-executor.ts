/**
 * Real-Time Tool Calling Framework
 * FREE implementation - no external paid APIs required
 * 
 * Allows voice agents to execute tools/functions during conversations
 * Tools can be HTTP endpoints, database queries, or custom functions
 */

export interface Tool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, {
      type: string
      description?: string
      enum?: string[]
    }>
    required?: string[]
  }
  execute: (params: Record<string, any>) => Promise<any>
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
}

export interface ToolResult {
  tool_call_id: string
  result: any
  error?: string
}

export class ToolExecutor {
  private tools: Map<string, Tool> = new Map()

  /**
   * Register a tool that can be called by the agent
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool)
    console.log(`[ToolExecutor] Registered tool: ${tool.name}`)
  }

  /**
   * Register multiple tools at once
   */
  registerTools(tools: Tool[]): void {
    tools.forEach(tool => this.registerTool(tool))
  }

  /**
   * Execute a tool call
   */
  async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.name)
    
    if (!tool) {
      return {
        tool_call_id: toolCall.id,
        result: null,
        error: `Tool ${toolCall.name} not found`,
      }
    }

    try {
      // Validate parameters
      this.validateParameters(tool, toolCall.arguments)
      
      // Execute tool
      const result = await tool.execute(toolCall.arguments)
      
      return {
        tool_call_id: toolCall.id,
        result,
      }
    } catch (error) {
      console.error(`[ToolExecutor] Error executing tool ${toolCall.name}:`, error)
      return {
        tool_call_id: toolCall.id,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Execute multiple tool calls in parallel
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results = await Promise.all(
      toolCalls.map(call => this.executeToolCall(call))
    )
    return results
  }

  /**
   * Get all registered tools (for LLM function calling)
   */
  getToolsForLLM(): Array<{
    type: 'function'
    function: {
      name: string
      description: string
      parameters: Tool['parameters']
    }
  }> {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }))
  }

  /**
   * Get tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  /**
   * List all registered tools
   */
  listTools(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * Remove a tool
   */
  unregisterTool(name: string): boolean {
    return this.tools.delete(name)
  }

  /**
   * Validate tool parameters against schema
   */
  private validateParameters(tool: Tool, params: Record<string, any>): void {
    const { properties, required } = tool.parameters

    // Check required parameters
    if (required) {
      for (const paramName of required) {
        if (!(paramName in params)) {
          throw new Error(`Missing required parameter: ${paramName}`)
        }
      }
    }

    // Validate parameter types
    for (const [paramName, paramValue] of Object.entries(params)) {
      const paramSchema = properties[paramName]
      if (!paramSchema) {
        console.warn(`[ToolExecutor] Unknown parameter: ${paramName}`)
        continue
      }

      // Type validation
      if (paramSchema.type === 'string' && typeof paramValue !== 'string') {
        throw new Error(`Parameter ${paramName} must be a string`)
      }
      if (paramSchema.type === 'number' && typeof paramValue !== 'number') {
        throw new Error(`Parameter ${paramName} must be a number`)
      }
      if (paramSchema.type === 'boolean' && typeof paramValue !== 'boolean') {
        throw new Error(`Parameter ${paramName} must be a boolean`)
      }
      if (paramSchema.type === 'array' && !Array.isArray(paramValue)) {
        throw new Error(`Parameter ${paramName} must be an array`)
      }
      if (paramSchema.type === 'object' && typeof paramValue !== 'object') {
        throw new Error(`Parameter ${paramName} must be an object`)
      }

      // Enum validation
      if (paramSchema.enum && !paramSchema.enum.includes(paramValue)) {
        throw new Error(`Parameter ${paramName} must be one of: ${paramSchema.enum.join(', ')}`)
      }
    }
  }
}

/**
 * Built-in tools that can be used by voice agents
 */

/**
 * HTTP Request Tool - Make API calls
 */
export function createHTTPTool(baseUrl?: string): Tool {
  return {
    name: 'http_request',
    description: 'Make an HTTP request to an API endpoint',
    parameters: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          description: 'HTTP method (GET, POST, PUT, DELETE)',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        },
        url: {
          type: 'string',
          description: 'Full URL or path (if baseUrl is set)',
        },
        headers: {
          type: 'object',
          description: 'HTTP headers',
        },
        body: {
          type: 'object',
          description: 'Request body (for POST/PUT)',
        },
      },
      required: ['method', 'url'],
    },
    async execute(params: { method: string; url: string; headers?: Record<string, string>; body?: any }) {
      const url = baseUrl ? `${baseUrl}${params.url}` : params.url
      const response = await fetch(url, {
        method: params.method,
        headers: {
          'Content-Type': 'application/json',
          ...params.headers,
        },
        body: params.body ? JSON.stringify(params.body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    },
  }
}

/**
 * Database Query Tool - Query database (read-only for safety)
 */
export function createDatabaseQueryTool(prisma: any): Tool {
  return {
    name: 'database_query',
    description: 'Query the database (read-only operations)',
    parameters: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'Prisma model name (e.g., Contact, Deal)',
        },
        action: {
          type: 'string',
          description: 'Query action',
          enum: ['findMany', 'findFirst', 'findUnique', 'count'],
        },
        where: {
          type: 'object',
          description: 'Where clause (filter conditions)',
        },
        select: {
          type: 'object',
          description: 'Fields to select',
        },
      },
      required: ['model', 'action'],
    },
    async execute(params: { model: string; action: string; where?: any; select?: any }) {
      // Safety: Only allow read operations
      const allowedActions = ['findMany', 'findFirst', 'findUnique', 'count']
      if (!allowedActions.includes(params.action)) {
        throw new Error(`Action ${params.action} is not allowed. Only read operations are permitted.`)
      }

      const model = prisma[params.model]
      if (!model) {
        throw new Error(`Model ${params.model} not found`)
      }

      const queryOptions: any = {}
      if (params.where) queryOptions.where = params.where
      if (params.select) queryOptions.select = params.select

      return await model[params.action](queryOptions)
    },
  }
}
