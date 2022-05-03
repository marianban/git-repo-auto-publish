import git from 'nodegit';
const { execSync } = require('child_process');

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

    this.headCommit = await repo.getBranchCommit('master');

    console.log(`resetting branch`);

    execSync(`cd ${this.repoPath}; git clean -f`);

    // await git.Reset.reset(repo, this.headCommit, git.Reset.TYPE.HARD, {
    //   checkoutStrategy: git.Checkout.STRATEGY.FORCE,
    // });

    console.log(`merging branches`);
    await repo.mergeBranches(branchName, `origin/${branchName}`, null, null, {
      fileFavor: git.Merge.FILE_FAVOR.THEIRS,
    });

    this.headCommit = await repo.getBranchCommit('master');
    this.walker = repo.createRevWalk();

    console.log('useBranch successfully completed');
  };

  hasNewCommitFrom = async (dirPath, fromDate) => {
    if (!this.walker) {
      throw new Error('Walker is undefined. Call useBranch first.');
    }
    if (!this.headCommit) {
      throw new Error('headCommit is undefined. Call useBranch first.');
    }

    const recentCommit = await this.getRecentDirCommit(dirPath);
    if (!recentCommit) {
      console.log('no new commits found.');
      return false;
    }
    const recentCommitDate = recentCommit.date();
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

  getRecentDirCommit = async (dirPath) => {
    this.walker.reset();
    this.walker.push(this.headCommit.sha());
    this.walker.sorting(git.Revwalk.SORT.TIME);

    console.log(`getting recent commit for: ${dirPath}`);

    const dir = dirPath.substring(this.repoPath.length + 1);

    const commits = await this.walker.getCommits(100);
    for (const commit of commits) {
      const diff = await commit.getDiff();
      for (const change of diff) {
        const patches = await change.patches();
        if (patches.some((p) => p.newFile().path().startsWith(dir))) {
          console.log(
            'recent commit: ' + commit.date() + ' ' + commit.summary()
          );
          return commit;
        }
      }
    }

    return null;
  };
}
