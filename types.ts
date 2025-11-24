
export interface GitHubUser {
  login: string;
  avatarUrl: string;
  url: string;
}

export interface ReactionGroup {
  content: string; // "THUMBS_UP", "HEART", etc.
  users: {
    totalCount: number;
  };
  viewerHasReacted: boolean;
}

export interface CommentNode {
  id: string;
  author: {
    login: string;
    avatarUrl: string;
    url: string;
  } | null;
  bodyHTML: string;
  body: string;
  createdAt: string;
  url: string;
  reactionGroups: ReactionGroup[];
  replies: {
    nodes: CommentNode[];
  };
}

export interface Discussion {
  id: string;
  number: number;
  url: string;
  comments: {
    totalCount: number;
    nodes: CommentNode[];
  };
}

export interface UserSession {
  token: string;
  user: GitHubUser;
  isGuest: boolean;
}

// Config matches Giscus data attributes
export interface GiscusConfig {
  repo: string;        // "owner/name"
  repoId: string;      // GraphQL ID
  category: string;    // Name
  categoryId: string;  // GraphQL ID
  term: string;        // Mapping term (e.g. pathname)
  theme: string;       // e.g. "light", "dark"
  reactionsEnabled: boolean;
  emitMetadata: boolean;
  strict: boolean;     // 1 or 0
  pageUrl?: string;    // The URL of the page hosting the comments
}

export enum LoginMode {
  GUEST = 'GUEST',
  GITHUB = 'GITHUB'
}
