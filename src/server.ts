import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";


const CURLMATE_BASE_URL = "https://api.curlmate.dev"

const zAccessTokenResponse = z.object({
  accessToken: z.string(),
})

const getAccessToken = async({ jwt, connection}: { jwt: string | undefined, connection: string | undefined}) => {
  if (!jwt) {
    return new Response("JWT missing", { status: 401 });
  }

  if (!connection) {
    return new Response("Connection missing", { status: 400});
  }

  const res = await fetch(`${CURLMATE_BASE_URL}/token`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "x-connection": connection,
    }
  })

  if (!res.ok) { 
    return new Response(`${await res.text()}`, { status: res.status});
  }

  const data = zAccessTokenResponse.parse(await res.json());
  return data.accessToken;
}

export class NotionMCP extends McpAgent<Env, {}> {
  server = new McpServer({
    name: "notion-remote-mcp",
    version: "0.0.1",
  });



  async init() {
    this.server.registerTool(
      "get-notion-page-format",
      {
        description: "get the sample page format",
        inputSchema: { }
      },
      async ({} , { requestInfo }) => {
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
      async ({ }, { requestInfo }) => {
        const jwt = requestInfo?.headers["access-token"] as string | undefined
        const connection = requestInfo?.headers["x-connection"] as string | undefined
        const accessToken = await getAccessToken({ jwt, connection });

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
            content: [{ text: JSON.stringify(await response.text()), type: "text" }]
          }
        }

        return {
          content: [{ text: JSON.stringify(await response.json()), type: "text" }]
        };
      }
    );
    this.server.registerTool(
      "create-notion-page",
      {
        description: "this tool lists all notion pages",
        inputSchema: {  pageData: z.string()}
      },
      async ({  pageData }, { requestInfo }) => {
        const jwt = requestInfo?.headers["access-token"] as string | undefined
        const connection = requestInfo?.headers["x-connection"] as string | undefined
        const accessToken = await getAccessToken({ jwt, connection });

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
      async ({ pageId }, { requestInfo }) => {
        const jwt = requestInfo?.headers["access-token"] as string | undefined
        const connection = requestInfo?.headers["x-connection"] as string | undefined
        const accessToken = await getAccessToken({ jwt, connection });

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
      async ({}, {requestInfo}) => {
        const jwt = requestInfo?.headers["access-token"] as string | undefined
        const connection = requestInfo?.headers["x-connection"] as string | undefined
        const accessToken = await getAccessToken({ jwt, connection });

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
            content: [{ text: JSON.stringify(await response.text()), type: "text" }]
          }
        }

        return {
          content: [{ text: JSON.stringify(await response.json()), type: "text" }]
        };
      }
    );
  }

  
  onError(_: unknown, error?: unknown): void | Promise<void> {
    console.error("NotionMCP initialization error:", error);

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
    if (url.pathname.startsWith("/sse")) {
      return NotionMCP.serveSSE("/sse", { binding: "NotionMCP" }).fetch(
        request,
        env,
        ctx
      );
    }

    if (url.pathname.startsWith("/mcp")) {
      return NotionMCP.serve("/mcp", { binding: "NotionMCP" }).fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  }
};
