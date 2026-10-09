import dotenv from 'dotenv';

// Load environment variables once for every entry point (MCP server, CLI, canvas server)
dotenv.config();

export const ENABLE_CANVAS_SYNC = process.env.ENABLE_CANVAS_SYNC !== 'false'; // Default to true
