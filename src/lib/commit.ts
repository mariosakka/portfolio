export interface Commit {
  message: string
  sha: string
}

const firstLine = (s: string): string => s.split(/\r?\n/)[0].trim()

export function readCommit(env: Record<string, string | undefined>, gitLog: () => string): Commit | null {
  try {
    if (env.GITHUB_SHA && env.COMMIT_MESSAGE) {
      return { message: firstLine(env.COMMIT_MESSAGE), sha: env.GITHUB_SHA.slice(0, 7) }
    }
    const line = firstLine(gitLog())
    const i = line.indexOf(' ')
    if (i < 1) return null
    return { message: line.slice(i + 1).trim(), sha: line.slice(0, i) }
  } catch {
    return null
  }
}
