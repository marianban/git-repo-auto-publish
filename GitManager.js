import git from 'nodegit';

export class GitManager {
  constructor(repoPath) {
    this.repoPath = repoPath;
  }

  useBranch = async (branchName) => {
    if (!this.repoPath) {
      throw new Error('repoPath is not set');
    }

    console.log(`opening repository: ${this.repoPath}`);
    const repo = await git.Repository.open(this.repoPath);

    console.log(`checking out branch: ${branchName}`);
    await repo.checkoutBranch(branchName, {
      checkoutStrategy: git.Checkout.STRATEGY.FORCE,
    });

    console.log(`fetching all`);
    await repo.fetchAll({
      callbacks: {
        credentials: (url, userName) => {
          return git.Cred.sshKeyFromAgent(userName);
        },
      },
    });

    console.log(`merging branches`);
    await repo.mergeBranches(branchName, `origin/${branchName}`, null, null, {
      fileFavor: git.Merge.FILE_FAVOR.THEIRS,
    });

    this.walker = repo.createRevWalk();
    this.headCommit = await repo.getBranchCommit('master');

    console.log('useBranch successfully completed');
  };

  hasNewCommitFrom = async (dirPath, fromDate) => {
    if (!this.walker) {
      throw new Error('Walker is undefined. Call useBranch first.');
    }
    if (!this.headCommit) {
      throw new Error('headCommit is undefined. Call useBranch first.');
    }

    this.walker.push(this.headCommit.sha());
    this.walker.sorting(git.Revwalk.SORT.TIME);

    console.log(`getting git history for: ${dirPath}`);
    const history = await this.walker.fileHistoryWalk(dirPath, 100);
    const recentCommit = history[0];
    if (!recentCommit) {
      console.log('no new commits found.');
      return false;
    }
    const recentCommitDate = recentCommit.commit.date();
    const hasNewCommit = recentCommitDate > fromDate;
    if (!hasNewCommit) {
      console.log(`no new commits since: ${fromDate}`);
    } else {
      console.log(
        `from ${fromDate} there is a newer commit with date ${recentCommitDate}`
      );
    }
    return hasNewCommit;
  };
}
