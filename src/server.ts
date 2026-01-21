import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import icon from "./mcp-icon.svg";

type State = { counter: number, product: number };

export class MyMCP extends McpAgent<Env, State, {}> {
  server = new McpServer({
    name: "Demo",
    version: "1.0.0",
    // Add icons and website URL to the server implementation
    icons: [
      {
        src: icon,
        sizes: ["any"],
        mimeType: "image/svg+xml"
      }
    ],
    websiteUrl: "https://github.com/cloudflare/agents"
  });

  initialState: State = {
    counter: 1,
    product: 0,
  };

  async init() {
    // Register resource - Note: Current MCP SDK doesn't support icons in resource method yet
    // Icons are supported at the server implementation level
    this.server.resource("counter", "mcp://resource/counter", (uri) => {
      return {
        contents: [{ text: String(this.state.counter), uri: uri.href }]
      };
    });
    // Register tool - Note: Current MCP SDK doesn't support icons in tool method yet
    // Icons are supported at the server implementation level
    this.server.registerTool(
      "add",
      {
        description: "Add to the counter, stored in the MCP",
        inputSchema: { a: z.number() }
      },
      async ({ a }) => {
        this.setState({ ...this.state, counter: this.state.counter + a });

        return {
          content: [
            {
              text: String(`Added ${a}, total is now ${this.state.counter}`),
              type: "text"
            }
          ]
        };
      }
    );
    this.server.registerTool(
      "multiply",
      {
        description: "Multiply 2 numbers",
        inputSchema: { a: z.number(), b: z.number() }
      },
      async ({ a, b }) => {
        this.setState({ ...this.state, product: this.state.product + a * b });

        return {
          content: [
            {
              text: String(`Multiplied ${a} and ${b}, product is now ${this.state.product}`),
              type: "text"
            }
          ]
        };
      }
    );
    this.server.registerTool(
      "get-notion-page-format",
      {
        description: "get the sample page format",
        inputSchema: { }
      },
      async ({  }) => {

        return {
          content: [
            {
              text: JSON.stringify({
                "parent": {
                  "data_source_id": "d9824bdc84454327be8b5b47500af6ce"
                },
                "icon": {
                  "emoji": "🥬"
                },
                "cover": {
                  "external": {
                    "url": "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg"
                  }
                },
                "properties": {
                  "Name": {
                    "title": [
                      {
                        "text": {
                          "content": "Tuscan Kale"
                        }
                      }
                    ]
                  },
                  "Description": {
                    "rich_text": [
                      {
                        "text": {
                          "content": "A dark green leafy vegetable"
                        }
                      }
                    ]
                  },
                  "Food group": {
                    "select": {
                      "name": "Vegetable"
                    }
                  },
                  "Price": { "number": 2.5 }
                },
                "children": [
                  {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                      "rich_text": [{ "type": "text", "text": { "content": "Lacinato kale" } }]
                    }
                  },
                  {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                      "rich_text": [
                        {
                          "type": "text",
                          "text": {
                            "content": "Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.",
                            "link": { "url": "https://en.wikipedia.org/wiki/Lacinato_kale" }
                          }
                        }
                      ]
                    }
                  }
                ]
              }),
              type: "text"
            }
          ]
        };
      }
    );
    this.server.registerTool(
      "List-All-Notion-Pages",
      {
        description: "this tool lists all notion pages",
        inputSchema: { }
      },
      async ({ }) => {
        const response = await fetch("https://api.notion.com/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
          },
          body: JSON.stringify({
            "filter": {
              "value": "page",
              "property": "object"
            },
            "sort":{
               "direction":"ascending",
               "timestamp":"last_edited_time"
            }
          })
        })

        if (!response.ok) {
          return {
            content: [
              {
                text: JSON.stringify(await response.text()),
                type: "text"
              }
            ]
          }
        }

        return {
          content: [
            {
              text: JSON.stringify(await response.json()),
              type: "text"
            }
          ]
        };
      }
    );
    this.server.registerTool(
      "create-notion-page",
      {
        description: "this tool lists all notion pages",
        inputSchema: {  pageData: z.string()}
      },
      async ({ pageData }) => {
        const response = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
          },
          body: pageData
        })

        if (!response.ok) {
          return {
            content: [
              {
                text: JSON.stringify(await response.text()),
                type: "text"
              }
            ]
          }
        }

        return {
          content: [
            {
              text: JSON.stringify(await response.json()),
              type: "text"
            }
          ]
        };
      }
    );
    this.server.registerTool(
      "fetch-notion-page",
      {
        description: "this tool fetches a notion page",
        inputSchema: { pageId: z.string()}
      },
      async ({ pageId }) => {
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
          }
        })

        if (!response.ok) {
          return {
            content: [
              {
                text: JSON.stringify(await response.text()),
                type: "text"
              }
            ]
          }
        }

        return {
          content: [
            {
              text: JSON.stringify(await response.json()),
              type: "text"
            }
          ]
        };
      }
    );
    this.server.registerTool(
      "authenticated-user",
      {
        description: "this tool lists the authenticated user",
        inputSchema: { }
      },
      async ({ }) => {
        const response = await fetch("https://api.notion.com/v1/users/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
          }
        })

        if (!response.ok) {
          return {
            content: [
              {
                text: JSON.stringify(await response.text()),
                type: "text"
              }
            ]
          }
        }

        return {
          content: [
            {
              text: JSON.stringify(await response.json()),
              type: "text"
            }
          ]
        };
      }
    );

    // Note: To fully support icons on tools and resources, you would need to use
    // the server's setRequestHandler method to manually implement the list handlers
    // with icon metadata, as shown in the commented example below:

    /*
    this.server.server.setRequestHandler("tools/list", async () => {
      return {
        tools: [{
          name: "add",
          description: "Add to the counter, stored in the MCP",
          inputSchema: { type: "object", properties: { a: { type: "number" } }, required: ["a"] },
          icons: [{
            src: "data:image/svg+xml;base64,...",
            mimeType: "image/svg+xml",
            sizes: "any"
          }]
        }]
      };
    });
    */
  }

  onStateUpdate(state: State) {
    console.log({ stateUpdate: state });
  }

  onError(_: unknown, error?: unknown): void | Promise<void> {
    console.error("MyMCP initialization error:", error);

    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("counter")) {
        console.error(
          "Failed to initialize counter resource. Please check the counter configuration."
        );
      } else if (error.message.includes("tool")) {
        console.error(
          "Failed to register MCP tools. Please verify tool configurations."
        );
      } else {
        // Fall back to default error handling
        console.error(error);
      }
    }
  }
}

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // support both legacy SSE and new streamable-http
    console.log(`url: ${url}`)
    if (url.pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse", { binding: "MyMCP" }).fetch(
        request,
        env,
        ctx
      );
    }

    if (url.pathname.startsWith("/mcp")) {
      return MyMCP.serve("/mcp", { binding: "MyMCP" }).fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  }
};
