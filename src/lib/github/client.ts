export async function fetchGitHubRepoFiles(repo: string, token?: string) {
  const GITHUB_TOKEN = token || process.env.GITHUB_TOKEN;
  
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token is missing. Please add GITHUB_TOKEN to your .env.local.');
  }

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  };

  // 1. Get the default branch
  const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!repoRes.ok) throw new Error(`Failed to fetch repo ${repo}`);
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;

  // 2. Get the tree recursively
  const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
  if (!treeRes.ok) throw new Error(`Failed to fetch tree for ${repo}`);
  const treeData = await treeRes.json();

  // 3. Filter for text/markdown files
  const validExtensions = ['.md', '.txt', '.ts', '.tsx', '.js', '.jsx', '.py'];
interface GitHubTreeItem {
    type: string;
    path: string;
    url: string;
  }
  const files = (treeData.tree as GitHubTreeItem[]).filter((item) =>
    item.type === 'blob' && validExtensions.some(ext => item.path.endsWith(ext))
  );

  // 4. Fetch content for a few files (limit to 10 for performance/MVP purposes)
  const filesToFetch = files.slice(0, 10);
  const contents = await Promise.all(
    filesToFetch.map(async (file: GitHubTreeItem) => {
      const contentRes = await fetch(file.url, { headers });
      const contentData = await contentRes.json();
      // GitHub API returns base64 encoded content for blobs
      const content = Buffer.from(contentData.content, 'base64').toString('utf-8');
      return { path: file.path, content };
    })
  );

  return contents;
}
