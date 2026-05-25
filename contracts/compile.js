const fs = require('fs');
const solc = require('solc');
const path = require('path');

function findImports(dependency) {
    try {
        const fullPath = path.resolve(__dirname, 'node_modules', dependency);
        return { contents: fs.readFileSync(fullPath, 'utf8') };
    } catch (e) {
        return { error: 'File not found' };
    }
}

const input = {
    language: 'Solidity',
    sources: {
        'AgentTipEscrow.sol': {
            content: fs.readFileSync('contracts/AgentTipEscrow.sol', 'utf8')
        },
        'AgentTipWill.sol': {
            content: fs.readFileSync('contracts/AgentTipWill.sol', 'utf8')
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*']
            }
        }
    }
};

console.log('Compiling contracts...');
const compiled = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (compiled.errors) {
    compiled.errors.forEach(err => console.error(err.formattedMessage));
    if (compiled.errors.some(e => e.severity === 'error')) {
        process.exit(1);
    }
}

// Ensure dir exists
if (!fs.existsSync('artifacts')) fs.mkdirSync('artifacts');

for (let contractName in compiled.contracts['AgentTipEscrow.sol']) {
    fs.writeFileSync(
        `artifacts/${contractName}.json`,
        JSON.stringify(compiled.contracts['AgentTipEscrow.sol'][contractName], null, 2)
    );
}
for (let contractName in compiled.contracts['AgentTipWill.sol']) {
    fs.writeFileSync(
        `artifacts/${contractName}.json`,
        JSON.stringify(compiled.contracts['AgentTipWill.sol'][contractName], null, 2)
    );
}

console.log('Compilation successful. ABIs generated in /artifacts');
