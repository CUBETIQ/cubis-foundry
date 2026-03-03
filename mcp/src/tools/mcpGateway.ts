/**
 * Cubis Foundry MCP Server – gateway status and enabled-tool discovery tools.
 */

import { z } from "zod";
import type { GatewayManager } from "../gateway/manager.js";

export const postmanListEnabledToolsName = "postman_list_enabled_tools";
export const postmanListEnabledToolsDescription =
  "List currently enabled Postman upstream passthrough tools and gateway warnings.";
export const postmanListEnabledToolsSchema = z.object({});

export const stitchListEnabledToolsName = "stitch_list_enabled_tools";
export const stitchListEnabledToolsDescription =
  "List currently enabled Stitch upstream passthrough tools and gateway warnings.";
export const stitchListEnabledToolsSchema = z.object({});

export const mcpGatewayStatusName = "mcp_gateway_status";
export const mcpGatewayStatusDescription =
  "Get passthrough gateway status for Postman and Stitch, including warnings and catalog location.";
export const mcpGatewayStatusSchema = z.object({});

function text(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function handlePostmanListEnabledTools(gateway: GatewayManager) {
  return text(gateway.listEnabledTools("postman"));
}

export function handleStitchListEnabledTools(gateway: GatewayManager) {
  return text(gateway.listEnabledTools("stitch"));
}

export function handleMcpGatewayStatus(gateway: GatewayManager) {
  return text(gateway.getStatus());
}
