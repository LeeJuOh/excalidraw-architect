# Saving

Read this when the user asks to save the canvas, a diagram, or a snapshot.

**Scope.** "Save this" saves the whole canvas — every diagram, with its
arrangement — as one `.excalidraw` file. "Save just the order diagram" saves
that one. Do not re-ask about scope each time; ask only when the named target
is ambiguous.

**Path and file name.** There is no fixed output folder.

- The user gave both: use both, exactly. Do not translate a file name they
  chose.
- Only a path: choose an English file name from what the diagram shows.
- Only a file name: choose the folder by looking at where this project already
  keeps its documents.
- Neither: choose both the same way, save without asking to confirm, and then
  tell the user the full path including the file name.

Report the path the save actually returned. If a file of that name is already
there, the server refuses it — pass that refusal on rather than overwriting or
appending a suffix, and do not report a failed save as a success.

**Unconfirmed values do not block a save.** If required elements are still
*not confirmed* when the user says "save this", save immediately, keep the
dashes and the markers, and tell them which items are unconfirmed. Never make
filling a value a precondition for saving.

**Snapshots** are kept on disk with no TTL: say that a snapshot survives the
server stopping and restarting and does not expire. If the user does not name
one, build the name from the creation time in UTC to the second plus an English
name for what the canvas shows — `YYYY-MM-DD_HHmmssZ_<english-name>`, for
example `2026-09-16_053012Z_order-flow`. A name the user gave is used as is.
Report the actual name and the full path the save returned; a collision on the
same second and name is a refusal, not a success.
