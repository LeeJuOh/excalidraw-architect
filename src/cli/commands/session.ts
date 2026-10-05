import { parseArgs, CliUsageError } from '../args.js';
import { printJson } from '../util.js';
import { findProjectRoot } from '../../core/project-root.js';
import {
  listLiveSessions,
  startCanvasSession,
  endCanvasSession,
  formatSessionList,
  unknownSessionError
} from '../../core/sessions.js';
import { setCanvasTarget } from '../../core/canvas-client.js';

const USAGE = 'session start --project <path> | session list | session end <key>';

export async function session(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv, { project: { takesValue: true } });
  const [action, key] = positionals;

  switch (action) {
    case 'start': {
      const project = flags.project as string | undefined;
      if (!project) {
        throw new CliUsageError(
          'session start needs --project <path>: the folder of the project you are working in. ' +
          'Its git root becomes the project root of the canvas session.'
        );
      }
      const projectRoot = findProjectRoot(project);
      const others = (await listLiveSessions()).filter(s => s.projectRoot === projectRoot);
      const started = await startCanvasSession(projectRoot);
      printJson({
        session: started.key,
        url: started.url,
        projectRoot: started.projectRoot,
        otherSessionsInProject: others.map(s => ({ session: s.key, url: s.url }))
      });
      return;
    }
    case 'list': {
      const live = await listLiveSessions();
      printJson(live.map(s => ({
        session: s.key,
        url: s.url,
        projectRoot: s.projectRoot,
        browserTabs: s.browserTabs,
        agents: s.agents
      })));
      return;
    }
    case 'end': {
      if (!key) throw new CliUsageError('Usage: session end <key>');
      const ended = await endCanvasSession(key);
      printJson({ ended: ended.key, url: ended.url, projectRoot: ended.projectRoot });
      return;
    }
    default:
      throw new CliUsageError(`Usage: ${USAGE}`);
  }
}

export const sessionUsage = USAGE;

/**
 * Point the canvas client at the session named by --session. Every command
 * that touches a canvas must name one: there is no default, because a guess
 * could draw on another project's canvas without any error (ADR-0003).
 */
export async function selectSession(key: string | undefined): Promise<void> {
  const live = await listLiveSessions();
  if (!key) {
    throw new CliUsageError(
      'This command needs --session <key>. Live canvas sessions (key, URL, project root):\n' +
      formatSessionList(live) +
      (live.length === 0 ? '\nStart one with `session start --project <path>`.' : '')
    );
  }
  const session = live.find(s => s.key === key);
  if (!session) {
    const error = unknownSessionError(key, live);
    error.message += '\nStart a new one with `session start --project <path>`.';
    throw error;
  }
  setCanvasTarget({ key: session.key, url: session.url });
}
