import git from 'nodegit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathToRepo = path.join(__dirname, '../slick-ui-demos/'); //?

const repo = await git.Repository.open(pathToRepo);

await repo.checkoutBranch('master');

await repo.fetchAll({
  callbacks: {
    credentials: (url, userName) => {
      return git.Cred.sshKeyFromAgent(userName);
    }
  }
});

await repo.mergeBranches('master', 'origin/master');

const walker = repo.createRevWalk();
const lastCommit = await repo.getBranchCommit('master');
walker.push(lastCommit.sha());
walker.sorting(git.Revwalk.SORT.TIME);

const commits = await walker.fileHistoryWalk('tornado', 1000);

console.log(commits.map(c => c.commit.date() ));


// how to get commits for folder https://github.com/nodegit/nodegit/issues/1068


// use level db https://www.npmjs.com/package/level
