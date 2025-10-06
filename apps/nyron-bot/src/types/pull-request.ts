export interface PullRequest {
    // Repository
    owner: string;
    repo: string;

    // PR Metadata
    number: number;
    title: string;
    body: string | null;
    user: string;
}