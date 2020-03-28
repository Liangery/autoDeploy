let { log, log_command } = require('./log.js');
const { exec } = require('child_process');


const commands = {
    git: {
        pull: 'git pull ',
        push: 'git push ',
        checkout: 'git checkout master',
        merge: 'git merge ',
        add: 'git add .',
        status: 'git status',
        commit: `git commit -m 'auto deploy'`,
        reset: 'git reset --hard origin/master',
        clean: 'git clean -f',
        build: 'npm run build',
    },
    sh: {
        chown: 'chown -R root:root '
    }
};

const execProxy = (command) => {
    return new Promise((resolve, reject) => {
        log_command(command);
        exec(command, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`执行的错误: ${error}`);
                return reject();
            }
            stdout && console.log(`stdout: ${stdout}`);
            stderr && console.log(`stderr: ${stderr}`);
            log_command();
            return resolve(stdout);
        });
    });

};
const cdDir = (p) => {
    process.chdir(p);
    console.log(process.cwd())
};

const runCommandSh = async (production) => {
    const repositoryPath = production.path;
    cdDir(repositoryPath);
    await execProxy(`${commands.git.checkout}`);
    await execProxy(`${commands.git.reset}`);
    await execProxy(commands.git.clean);
    await execProxy(commands.git.pull);
    await execProxy(commands.git.checkout);
    await execProxy(commands.sh.chown + repositoryPath);
    if (Array.isArray(production.commands)) {
        production.commands.forEach(async com => {
            await execProxy(com);
        });
    }
}

const getAllEvents = (config) => {
    const events = [];
    for (let key in config) {
        if (Array.isArray(config[key].events) && config[key].path) {
            config[key].events.forEach(e => {
                if (events.indexOf(e) == -1) {
                    events.push(e);
                }
            });
        }
    }
    return events;
}

module.exports = {
    cdDir,
    execProxy,
    commands,
    runCommandSh,
    getAllEvents
}