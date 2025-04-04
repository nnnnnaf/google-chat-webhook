/**
 * GitHub webhook payload types
 */

export interface GitHubRepository {
  id?: number;
  name?: string;
  full_name?: string;
  html_url?: string;
  owner?: {
    login?: string;
    avatar_url?: string;
  };
}

export interface GitHubSender {
  login?: string;
  id?: number;
  avatar_url?: string;
  html_url?: string;
}

export interface GitHubPullRequest {
  number?: number;
  title?: string;
  html_url?: string;
  user?: {
    login?: string;
  };
}

export interface GitHubIssue {
  number?: number;
  title?: string;
  html_url?: string;
  user?: {
    login?: string;
  };
  pull_request?: any; // If exists, issue is a pull request
}

export interface GitHubComment {
  id?: number;
  body?: string;
  html_url?: string;
  user?: {
    login?: string;
  };
  commit_id?: string; // For commit comments
}

export interface GitHubWorkflowRun {
  id?: number;
  name?: string;
  workflow_name?: string;
  head_branch?: string;
  head_sha?: string;
  status?: string;
  conclusion?: string;
  html_url?: string;
  display_title?: string;
  event?: string;
}

export interface GitHubWorkflowJob {
  id?: number;
  run_id?: number;
  workflow_name?: string;
  name?: string;
  head_branch?: string;
  head_sha?: string;
  status?: string;
  conclusion?: string;
  html_url?: string;
  steps?: GitHubWorkflowStep[];
}

export interface GitHubWorkflowStep {
  name?: string;
  status?: string;
  conclusion?: string;
  number?: number;
}

export interface GitHubCheckRun {
  id?: number;
  name?: string;
  head_branch?: string;
  head_sha?: string;
  status?: string;
  conclusion?: string;
  html_url?: string;
  check_suite?: {
    head_branch?: string;
  };
  pull_requests?: GitHubPullRequest[];
}

export interface GitHubCheckSuite {
  id?: number;
  head_branch?: string;
  head_sha?: string;
  status?: string;
  conclusion?: string;
  html_url?: string;
  pull_requests?: GitHubPullRequest[];
}

export interface GitHubRegistryPackage {
  name?: string;
  package_type?: string;
  html_url?: string;
  namespace?: string;
  package_version?: {
    version?: string;
  };
}

export interface GitHubWebhookPayload {
  action?: string;
  repository?: GitHubRepository;
  sender?: GitHubSender;
  issue?: GitHubIssue;
  pull_request?: GitHubPullRequest;
  comment?: GitHubComment;
  workflow_run?: GitHubWorkflowRun;
  workflow_job?: GitHubWorkflowJob;
  check_run?: GitHubCheckRun;
  check_suite?: GitHubCheckSuite;
  registry_package?: GitHubRegistryPackage;
  ref?: string;
  ref_type?: string;
  commits?: any[];
  pusher?: {
    name?: string;
  };
} 