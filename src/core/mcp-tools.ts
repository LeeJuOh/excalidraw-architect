import type { Tool } from '@modelcontextprotocol/server';
import { EXCALIDRAW_ELEMENT_TYPES } from '../types.js';

// Tool definitions
export const tools: Tool[] = [
  {
    name: 'session_start',
    description: 'Start a new canvas session for this conversation and attach to it. Call it once, on the first turn, before any drawing tool. Returns the URL to give the user, the session key and the project root (the git root at or above projectPath). Also names other live canvas sessions in the same project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Absolute path of the project folder you are working in' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'session_attach',
    description: 'Attach to a live canvas session by its key instead of the current one. Only when the user asks for that canvas. Later tool calls draw there.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Session key, as shown by session_list or the browser tab title' }
      },
      required: ['key']
    }
  },
  {
    name: 'session_list',
    description: 'List the live canvas sessions on this machine: key, URL, project root, open browser tabs, attached agents.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'session_end',
    description: 'End a canvas session and stop its canvas server. Without key: the session this conversation is attached to. With key: that session — only when the user asks. Unsaved drawings on it are lost.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Session key of another canvas session to end' }
      }
    }
  },
  {
    name: 'create_element',
    description: 'Create a new Excalidraw element. For arrows, use startElementId/endElementId to bind to shapes (auto-routes to edges). A drawing is a frame: create {type: "frame", name: "<title>"} and give each child frameId = the frame id. A frame without width/height takes the range of its children plus 40, so it needs children in the same batch. The frame grows when a child lands outside it; moving it moves its children; deleting it deletes them.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Custom element ID (optional, auto-generated if omitted). Use with startElementId/endElementId in batch_create_elements.' },
        type: {
          type: 'string',
          enum: Object.values(EXCALIDRAW_ELEMENT_TYPES)
        },
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
        backgroundColor: { type: 'string' },
        strokeColor: { type: 'string' },
        strokeWidth: { type: 'number' },
        strokeStyle: { type: 'string', description: 'Stroke style: solid, dashed, dotted' },
        roughness: { type: 'number' },
        opacity: { type: 'number' },
        text: { type: 'string' },
        fontSize: { type: 'number' },
        fontFamily: { type: ['string', 'number'], description: 'Font family: nunito (6, the default) or comic shanns/comic (8, monospace, for code and contracts). Also excalifont (5), lilita (7), or a numeric ID. Do not use virgil (1), helvetica (2) or cascadia (3): Excalidraw marks them old. On a box or an arrow it applies to the label.' },
        frameId: { type: ['string', 'null'], description: 'ID of the frame (drawing) this element belongs to. The frame must exist or be in the same batch. null takes the element out of its frame.' },
        name: { type: 'string', description: 'For frames: the drawing title shown on the frame' },
        link: { type: ['string', 'null'], description: 'Link opened from the element. "?element=<frame id>" points at another drawing and moves the canvas to it on click. null removes the link.' },
        startElementId: { type: 'string', description: 'For arrows: ID of the element to bind the arrow start to. Arrow auto-routes to element edge.' },
        endElementId: { type: 'string', description: 'For arrows: ID of the element to bind the arrow end to. Arrow auto-routes to element edge.' },
        endArrowhead: { type: 'string', description: 'Arrowhead style at end: arrow, bar, dot, triangle, or null' },
        startArrowhead: { type: 'string', description: 'Arrowhead style at start: arrow, bar, dot, triangle, or null' }
      },
      required: ['type', 'x', 'y']
    }
  },
  {
    name: 'update_element',
    description: 'Update an existing Excalidraw element',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: {
          type: 'string',
          enum: Object.values(EXCALIDRAW_ELEMENT_TYPES)
        },
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
        backgroundColor: { type: 'string' },
        strokeColor: { type: 'string' },
        strokeWidth: { type: 'number' },
        strokeStyle: { type: 'string' },
        roughness: { type: 'number' },
        opacity: { type: 'number' },
        text: { type: 'string' },
        fontSize: { type: 'number' },
        fontFamily: { type: ['string', 'number'], description: 'Font family: nunito (6, the default) or comic shanns/comic (8, monospace, for code and contracts). Also excalifont (5), lilita (7), or a numeric ID. Do not use virgil (1), helvetica (2) or cascadia (3): Excalidraw marks them old. On a box or an arrow it applies to the label.' },
        frameId: { type: ['string', 'null'], description: 'ID of the frame (drawing) this element belongs to. The frame must exist or be in the same batch. null takes the element out of its frame.' },
        name: { type: 'string', description: 'For frames: the drawing title shown on the frame' },
        link: { type: ['string', 'null'], description: 'Link opened from the element. "?element=<frame id>" points at another drawing and moves the canvas to it on click. null removes the link.' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_element',
    description: 'Delete an Excalidraw element. Deleting a frame also deletes the elements in it.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'query_elements',
    description: 'Query Excalidraw elements with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: Object.values(EXCALIDRAW_ELEMENT_TYPES)
        },
        filter: {
          type: 'object',
          additionalProperties: true
        },
        bbox: {
          type: 'object',
          description: 'Bounding box filter — only return elements whose origin (x, y) falls within the given coordinate range',
          properties: {
            x_min: { type: 'number' },
            x_max: { type: 'number' },
            y_min: { type: 'number' },
            y_max: { type: 'number' }
          }
        }
      }
    }
  },
  {
    name: 'get_resource',
    description: 'Get an Excalidraw resource',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { 
          type: 'string', 
          enum: ['scene', 'library', 'theme', 'elements'] 
        }
      },
      required: ['resource']
    }
  },
  {
    name: 'group_elements',
    description: 'Group multiple elements together',
    inputSchema: {
      type: 'object',
      properties: {
        elementIds: { 
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['elementIds']
    }
  },
  {
    name: 'ungroup_elements',
    description: 'Ungroup a group of elements',
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'string' }
      },
      required: ['groupId']
    }
  },
  {
    name: 'align_elements',
    description: 'Align elements to a specific position',
    inputSchema: {
      type: 'object',
      properties: {
        elementIds: { 
          type: 'array',
          items: { type: 'string' }
        },
        alignment: { 
          type: 'string', 
          enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'] 
        }
      },
      required: ['elementIds', 'alignment']
    }
  },
  {
    name: 'distribute_elements',
    description: 'Distribute elements evenly',
    inputSchema: {
      type: 'object',
      properties: {
        elementIds: { 
          type: 'array',
          items: { type: 'string' }
        },
        direction: { 
          type: 'string', 
          enum: ['horizontal', 'vertical'] 
        }
      },
      required: ['elementIds', 'direction']
    }
  },
  {
    name: 'lock_elements',
    description: 'Lock elements to prevent modification',
    inputSchema: {
      type: 'object',
      properties: {
        elementIds: { 
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['elementIds']
    }
  },
  {
    name: 'unlock_elements',
    description: 'Unlock elements to allow modification',
    inputSchema: {
      type: 'object',
      properties: {
        elementIds: { 
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['elementIds']
    }
  },
  {
    name: 'create_from_mermaid',
    description: 'Convert a Mermaid diagram to Excalidraw elements and render them on the canvas',
    inputSchema: {
      type: 'object',
      properties: {
        mermaidDiagram: {
          type: 'string',
          description: 'The Mermaid diagram definition (e.g., "graph TD; A-->B; B-->C;")'
        },
        config: {
          type: 'object',
          description: 'Optional Mermaid configuration',
          properties: {
            startOnLoad: { type: 'boolean' },
            flowchart: {
              type: 'object',
              properties: {
                curve: { type: 'string', enum: ['linear', 'basis'] }
              }
            },
            themeVariables: {
              type: 'object',
              properties: {
                fontSize: { type: 'string' }
              }
            },
            maxEdges: { type: 'number' },
            maxTextSize: { type: 'number' }
          }
        }
      },
      required: ['mermaidDiagram']
    }
  },
  {
    name: 'batch_create_elements',
    description: 'Create multiple Excalidraw elements at once. For arrows, use startElementId/endElementId to bind arrows to shapes — Excalidraw auto-routes to element edges. Assign custom id to shapes so arrows can reference them. A drawing is a frame: create {type: "frame", name: "<title>"} and give each child frameId = the frame id. A frame without width/height takes the range of its children plus 40, so it needs children in the same batch. The frame grows when a child lands outside it; moving it moves its children; deleting it deletes them. One invalid frameId rejects the whole batch.',
    inputSchema: {
      type: 'object',
      properties: {
        elements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Custom element ID. Arrows can reference this via startElementId/endElementId.' },
              type: {
                type: 'string',
                enum: Object.values(EXCALIDRAW_ELEMENT_TYPES)
              },
              x: { type: 'number' },
              y: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
              backgroundColor: { type: 'string' },
              strokeColor: { type: 'string' },
              strokeWidth: { type: 'number' },
              strokeStyle: { type: 'string', description: 'Stroke style: solid, dashed, dotted' },
              roughness: { type: 'number' },
              opacity: { type: 'number' },
              text: { type: 'string' },
              fontSize: { type: 'number' },
              fontFamily: { type: ['string', 'number'], description: 'Font family: nunito (6, the default) or comic shanns/comic (8, monospace, for code and contracts). Also excalifont (5), lilita (7), or a numeric ID. Do not use virgil (1), helvetica (2) or cascadia (3): Excalidraw marks them old. On a box or an arrow it applies to the label.' },
              frameId: { type: ['string', 'null'], description: 'ID of the frame (drawing) this element belongs to. The frame must exist or be in the same batch. null takes the element out of its frame.' },
              name: { type: 'string', description: 'For frames: the drawing title shown on the frame' },
              link: { type: ['string', 'null'], description: 'Link opened from the element. "?element=<frame id>" points at another drawing and moves the canvas to it on click. null removes the link.' },
              startElementId: { type: 'string', description: 'For arrows: ID of element to bind arrow start to' },
              endElementId: { type: 'string', description: 'For arrows: ID of element to bind arrow end to' },
              endArrowhead: { type: 'string', description: 'Arrowhead style at end: arrow, bar, dot, triangle, or null' },
              startArrowhead: { type: 'string', description: 'Arrowhead style at start: arrow, bar, dot, triangle, or null' }
            },
            required: ['type', 'x', 'y']
          }
        }
      },
      required: ['elements']
    }
  },
  {
    name: 'get_element',
    description: 'Get a single Excalidraw element by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The element ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'clear_canvas',
    description: 'Clear all elements from the canvas',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'export_scene',
    description: 'Export the whole canvas, or one frame, to .excalidraw JSON format. Optionally write to a file; a path ending in .excalidraw.md is written in the Obsidian Excalidraw plugin format. Missing folders are made. A file that already exists is refused (with when it was made) unless force is true. Returns the full path written.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Optional file path to write the scene to (.excalidraw for raw JSON, .excalidraw.md for the Obsidian Excalidraw plugin format). A relative path is resolved from the project root.'
        },
        frame: {
          type: 'string',
          description: 'Export only this frame (name or id) and its elements. Bindings to elements outside it are cut; links stay.'
        },
        force: {
          type: 'boolean',
          description: 'Overwrite a file that already exists'
        }
      }
    }
  },
  {
    name: 'import_scene',
    description: 'Load a .excalidraw, Obsidian .excalidraw.md or .json file, or raw JSON data, as an independent copy beside what is on the canvas. Nothing is cleared. Every id is new; named frames become "<name> (복사)"; a file without frames is wrapped in one unnamed frame. The result lists unnamed frame ids to name.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path to a .excalidraw, Obsidian .excalidraw.md or .json file. A relative path is resolved from the project root.'
        },
        data: {
          type: 'string',
          description: 'Raw .excalidraw JSON string (alternative to filePath)'
        }
      }
    }
  },
  {
    name: 'export_to_image',
    description: 'Export the current canvas to PNG or SVG image. Requires the canvas frontend to be open in a browser. A file that already exists is refused (with when it was made) unless force is true.',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['png', 'svg'],
          description: 'Image format'
        },
        filePath: {
          type: 'string',
          description: 'Optional file path to save the image. A relative path is resolved from the project root. Missing folders are made.'
        },
        background: {
          type: 'boolean',
          description: 'Include background in export (default: true)'
        },
        force: {
          type: 'boolean',
          description: 'Overwrite a file that already exists'
        }
      },
      required: ['format']
    }
  },
  {
    name: 'duplicate_elements',
    description: 'Duplicate elements with a configurable offset',
    inputSchema: {
      type: 'object',
      properties: {
        elementIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of elements to duplicate'
        },
        offsetX: { type: 'number', description: 'Horizontal offset (default: 20)' },
        offsetY: { type: 'number', description: 'Vertical offset (default: 20)' }
      },
      required: ['elementIds']
    }
  },
  {
    name: 'snapshot_scene',
    description: 'Save a named snapshot of the whole canvas to disk for later restoration. Snapshots are kept per project, survive server restarts and never expire. A name that already exists is refused (with when it was made) unless force is true. Returns the name and the full file path.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for this snapshot, without extension'
        },
        force: {
          type: 'boolean',
          description: 'Overwrite a snapshot that already has this name'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'restore_snapshot',
    description: 'Restore the canvas from a saved snapshot of this project. Clears the whole canvas first, then puts the snapshot back with its original ids.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the snapshot to restore'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'describe_scene',
    description: 'Get an AI-readable description of the current canvas: element types, positions, connections, labels, spatial layout, and bounding box. Elements are grouped by drawing (frame) with a count per frame; elements in no frame are listed last. Use this to understand what is on the canvas before making changes.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_canvas_screenshot',
    description: 'Take a screenshot of the current canvas and return it as an image. Requires the canvas frontend to be open in a browser. Use this to visually verify what the diagram looks like.',
    inputSchema: {
      type: 'object',
      properties: {
        background: {
          type: 'boolean',
          description: 'Include background in screenshot (default: true)'
        }
      }
    }
  },
  {
    name: 'export_to_excalidraw_url',
    description: 'Export the current canvas to a shareable excalidraw.com URL. The diagram is encrypted and uploaded; anyone with the URL can view it. Returns the shareable link.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'set_viewport',
    description: 'Control the canvas viewport (camera). Auto-fit all elements, zoom-to-fit a subset of elements, center on a specific element, or set zoom/scroll directly. Requires the canvas frontend open in a browser.',
    inputSchema: {
      type: 'object',
      properties: {
        scrollToContent: {
          type: 'boolean',
          description: 'Auto-fit all elements in view (zoom-to-fit)'
        },
        scrollToElementIds: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          description: 'Zoom-to-fit the bounding box of one or more elements by ID; every ID must exist'
        },
        viewportZoomFactor: {
          type: 'number',
          exclusiveMinimum: 0,
          maximum: 1,
          description: 'Optional fit-to-viewport zoom factor in the range (0, 1] for scrollToContent or scrollToElementIds; lower values leave more padding'
        },
        scrollToElementId: {
          type: 'string',
          description: 'Center the view on a specific element by ID'
        },
        zoom: {
          type: 'number',
          description: 'Zoom level (0.1–10, where 1 = 100%)'
        },
        offsetX: {
          type: 'number',
          description: 'Horizontal scroll offset'
        },
        offsetY: {
          type: 'number',
          description: 'Vertical scroll offset'
        }
      }
    }
  }
];
