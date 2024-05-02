// Modulos Externos
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');

// variaveis globais
const regex = /^\d+$/;

// Função principal
function operation() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'O que você deseja fazer?',
        choices: [
          'Criar Conta',
          'Mostrar Contas',
          'Consultar Saldo',
          'Depositar',
          'Sacar',
          'Limpar Tela',
          'Sair'
        ],
      }
    ])
    .then((answer) => {
      const action = answer.action;

      if (action === 'Criar Conta') {
        createAccount();
      } else if (action === 'Mostrar Contas') {
        showAccounts();
      } else if (action === 'Depositar') {
        deposit();
      } else if (action === 'Sacar') {
        withdraw();
      } else if (action === 'Consultar Saldo') {
        getAccountBalance();
      } else if (action === 'Limpar Tela') {
        console.clear();
        operation();
      } else if (action === 'Sair') {
        console.log(chalk.bgBlue.black.bold(' Obrigado por usar nosso banco :) '));
        process.exit();
      }
    })
    .catch(err => console.log(err));
}

// Criar Conta
function createAccount() {
  console.log(chalk.bgGreen.black(' Obrigado por escolher nosso banco '));
  console.log(chalk.green(' Defina as opções da conta a seguir '));
  buildAccount();
}

function buildAccount() {
  inquirer
    .prompt([
      {
        name: 'accountName',
        message: 'Digite um nome para sua conta:'
      }
    ])
    .then((answer) => {
      const accountName = answer.accountName;

      if (!fs.existsSync('accounts')) {
        fs.mkdirSync('accounts');
      }

      if (fs.existsSync(`accounts/${accountName}.json`)) {
        console.log(chalk.bgRed.black(' Essa conta já existe, escolha outro nome '));
        return buildAccount();
      }

      fs.writeFileSync(
        `accounts/${accountName}.json`,
        '{"balance": 0}',
        (err) => console.log(err)
      );

      console.log(chalk.green(' Parabéns, sua conta foi criada '));
      operation();
    })
    .catch(err => console.log(err));
}

// Depositar
function deposit() {
  inquirer
    .prompt([
      {
        name: 'accountName',
        message: 'Qual nome da sua conta:'
      }
    ])
    .then((answer) => {
      const accountName = answer.accountName;

      if (!accountExist(accountName)) {
        return deposit();
      }

      inquirer
        .prompt([
          {
            name: 'amount',
            message: 'Quanto você deseja depositar?'
          }
        ])
        .then((answer) => {
          const amount = answer.amount;
          addAmount(accountName, amount);
          operation();
        });
    })
    .catch(err => console.log(err));
}

// Verificar se a conta existe
function accountExist(accountName) {
  if (!fs.existsSync(`accounts/${accountName}.json`)) {
    console.log(chalk.bgRed.black(' Essa conta não existe, tente novamente '));
    return false;
  }
  return true;
}

// Adicionar valor à conta do usuário
function addAmount(accountName, amount) {
  const accountData = getAccount(accountName);
  if (!amount || amount < 0 || regex.test(amount) == false) {
    console.log(chalk.red(' Ocorreu um erro! Valor impossível de ser depositado '));
    return;
  }

  accountData.balance = parseFloat(amount) + parseFloat(accountData.balance);
  fs.writeFileSync(
    `accounts/${accountName}.json`,
    JSON.stringify(accountData),
    (err) => console.log(err)
  );

  console.log(chalk.bgGreen.black(` Depósito de R$${amount} feito com sucesso! `));
  console.log(chalk.bgGreen.black(` Saldo de R$${accountData.balance} `));
}

// Obter os dados da conta
function getAccount(accountName) {
  const accountJSON = fs.readFileSync(
    `accounts/${accountName}.json`,
    {
      encoding: 'utf8',
      flag: 'r'
    }
  );

  return JSON.parse(accountJSON);
}

// Consultar saldo da conta
function getAccountBalance() {
  inquirer
    .prompt([
      {
        name: 'accountName',
        message: 'Qual nome da sua conta?'
      }
    ])
    .then((answer) => {
      const accountName = answer.accountName;

      if (!accountExist(accountName)) {
        getAccountBalance();
        return;
      }

      const accountData = getAccount(accountName);
      console.log(chalk.bgBlueBright.black(` A conta ${accountName} tem o saldo de R$${accountData.balance} `))
      operation();
    })
    .catch(err => console.log(err));
}

// Sacar uma quantia da conta do usuário
function withdraw() {
  inquirer
    .prompt([
      {
        name: 'accountName',
        message: 'Qual conta você deseja sacar'
      }
    ])
    .then((answer) => {
      const accountName = answer.accountName;

      if (!accountExist(accountName)) {
        return withdraw();
      }

      inquirer
        .prompt([
          {
            name: 'amount',
            message: 'Quanto você deseja sacar?'
          }
        ])
        .then((answer) => {
          const amount = answer.amount;
          removeAmount(accountName, amount);
          operation();
        });
    })
    .catch(err => console.log(err));
}

// Remover uma quantia da conta do usuário
function removeAmount(accountName, amount) {
  const accountData = getAccount(accountName);
  if (!amount || amount > accountData.balance || regex.test(amount) == false) {
    console.log(chalk.red('Ocorreu um erro! Valor impossível de ser sacado'));
    return withdraw();
  }

  accountData.balance = parseFloat(accountData.balance) - parseFloat(amount);
  fs.writeFileSync(
    `accounts/${accountName}.json`,
    JSON.stringify(accountData),
    (err) => console.log(err)
  );

  console.log(chalk.bgGreen.black(` Saque de R$${amount} feito com sucesso! `));
  console.log(chalk.bgGreen.black(` Saldo de R$${accountData.balance} `));
}

// Mostrar contas
function showAccounts() {
  let i = 0;
  fs.readdir('accounts', (err, files) => {
    if (err) console.log(err);
    files.forEach(file => {
      i++;
      file = file.replace('.json', '');
      console.log(chalk.cyan.bold(`  Conta número ${i}: ${file}`));
    });
    operation();
  });
}

operation();
