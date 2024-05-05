const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;

const ACCOUNTS_DIR = 'accounts';
const LOGS_DIR = 'logs';
const regex = /^\d+$/;
const helpMsg = 'press Ctrl + C to exit';

// Função para lidar com erros
function handleError(err) {
  console.error(chalk.red(err.message));
}

// Operações disponíveis
const operations = {
  'Criar Conta': createAccount,
  'Mostrar Contas': showAccounts,
  'Consultar Saldo': getAccountBalance,
  'Depositar': deposit,
  'Sacar': withdraw,
  'Transferir': transfer,
  'Limpar Tela': clearScreen
};

// Função principal que controla as operações do banco
async function operation() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `${helpMsg} \n  O que você deseja fazer?`,
      choices: Object.keys(operations),
    }
  ]);

  // Executa a operação selecionada pelo usuário
  await operations[action]();
}

// Função para criar uma nova conta
async function createAccount() {
  console.log(chalk.bgGreen.black(' Obrigado por escolher nosso banco '));
  console.log(chalk.green(' Defina as opções da conta a seguir '));
  await buildAccount();
}

// Função para construir uma nova conta
async function buildAccount() {
  const { accountName } = await inquirer.prompt([
    {
      name: 'accountName',
      message: 'Digite um nome para sua conta:'
    }
  ]);

  // Verifica se a conta já existe
  if (await accountExist(accountName)) {
    console.log(chalk.bgRed.black(' Essa conta já existe, escolha outro nome '));
    return buildAccount();
  }

  // Cria a conta se ela não existe
  await fs.writeFile(
    `${ACCOUNTS_DIR}/${accountName}.json`,
    JSON.stringify({ balance: 0 })
  );

  console.log(chalk.green(' Parabéns, sua conta foi criada '));
  await operation();
}

// Função para verificar se uma conta já existe
async function accountExist(accountName) {
  try {
    // Tenta acessar o arquivo da conta
    await fs.access(`${ACCOUNTS_DIR}/${accountName}.json`);
    return true;
  } catch (err) {
    return false;
  }
}

// Função para realizar um depósito em uma conta
async function deposit() {
  const { accountName } = await inquirer.prompt([
    {
      name: 'accountName',
      message: 'Qual nome da sua conta:'
    }
  ]);

  // Verifica se a conta existe
  if (!await accountExist(accountName)) {
    console.log(chalk.bgRed.black(' Essa conta não existe, crie uma nova conta primeiro '));
    return await operation();
  }

  const { amount } = await inquirer.prompt([
    {
      name: 'amount',
      message: 'Quanto você deseja depositar?'
    }
  ]);

  // Adiciona o valor ao saldo da conta
  await addAmount(accountName, amount);
}

// Função para adicionar um valor ao saldo da conta
async function addAmount(accountName, amount) {
  // Verifica se o valor informado é válido
  if (!amount || amount < 0 || !regex.test(amount)) {
    console.log(chalk.bgRed.black('Ocorreu um erro! Valor impossível de ser depositado'));
    await operation();
    return;
  }

  // Obtém os dados da conta
  const accountData = await getAccount(accountName);
  accountData.balance = parseFloat(amount) + parseFloat(accountData.balance);

  // Salva os novos dados da conta no arquivo
  await fs.writeFile(
    `${ACCOUNTS_DIR}/${accountName}.json`,
    JSON.stringify(accountData)
  );

  console.log(chalk.bgGreen.black(` Depósito de R$${amount} feito com sucesso! `));
  console.log(chalk.bgGreen.black(` Saldo de R$${accountData.balance} `));
  const depositLog = `Deposito efetuado com sucesso no valor de R$${amount} para ${accountName} | ${getHour()} \n`;
  await fs.appendFile(
    `${LOGS_DIR}/depositos.txt`,
    depositLog
  );
  await operation();
}

// Função para realizar um saque de uma conta
async function withdraw() {
  const { accountName } = await inquirer.prompt([
    {
      name: 'accountName',
      message: 'Qual conta você deseja sacar'
    }
  ]);

  // Verifica se a conta existe
  if (!await accountExist(accountName)) {
    console.log(chalk.bgRed.black(' Essa conta não existe, crie uma nova conta primeiro '));
    return await operation();
  }

  const { amount } = await inquirer.prompt([
    {
      name: 'amount',
      message: 'Quanto você deseja sacar?'
    }
  ]);

  // Remove o valor do saldo da conta
  await removeAmount(accountName, amount);
}

// Função para remover um valor do saldo da conta
async function removeAmount(accountName, amount) {
  // Obtém os dados da conta
  const accountData = await getAccount(accountName);

  // Verifica se o valor informado é válido
  if (!amount || amount > accountData.balance || !regex.test(amount)) {
    console.log(chalk.bgRed.black(' Ocorreu um erro! Valor impossível de ser sacado '));
    await operation();
    return;
  }

  accountData.balance = parseFloat(accountData.balance) - parseFloat(amount);

  // Salva os novos dados da conta no arquivo
  await fs.writeFile(
    `${ACCOUNTS_DIR}/${accountName}.json`,
    JSON.stringify(accountData)
  );

  console.log(chalk.bgGreen.black(` Saque de R$${amount} feito com sucesso! `));
  console.log(chalk.bgGreen.black(` Saldo de R$${accountData.balance} `));
  const withdrawLog = `Saque efetuado com sucesso no valor de R$${amount} de ${accountName} | ${getHour()} \n`;
  await fs.appendFile(
    `${LOGS_DIR}/saques.txt`,
    withdrawLog
  );
  await operation();
}

// Função para listar todas as contas existentes
async function showAccounts() {
  // Lê o diretório "accounts" e lista os arquivos de contas
  const files = await fs.readdir(ACCOUNTS_DIR);
  let i = 0;
  files.forEach(file => {
    i++;
    file = file.replace('.json', '');
    console.log(chalk.cyan.bold(`  Conta número ${i}: ${file}`));
  });
  await operation();
}

// Função para obter os dados de uma conta
async function getAccount(accountName) {
  // Lê o arquivo da conta e retorna os dados
  const accountJSON = await fs.readFile(
    `${ACCOUNTS_DIR}/${accountName}.json`,
    'utf8'
  );

  return JSON.parse(accountJSON);
}

// Função para consultar o saldo de uma conta
async function getAccountBalance() {
  const { accountName } = await inquirer.prompt([
    {
      name: 'accountName',
      message: 'Qual nome da sua conta?'
    }
  ]);

  // Verifica se a conta existe
  if (!await accountExist(accountName)) {
    await getAccountBalance();
    return;
  }

  // Obtém os dados da conta e exibe o saldo
  const accountData = await getAccount(accountName);
  console.log(chalk.bgBlueBright.black(` A conta ${accountName} tem o saldo de R$${accountData.balance} `));
  await operation();
}

// Transferi valor de uma conta para outra
async function transfer() {
  // Pega o valor da conta quer vai transferir
  const { account1 } = await inquirer.prompt([
    {
      name: 'account1',
      message: chalk.bold(helpMsg) + '  \n Qual conta você deseja sacar: '
    }
  ]);

  if (await accountExist(account1) == false) {
    console.log(chalk.bgRed.black(' Essa conta não existe, escolha uma conta que existe '));
    return transfer();
  }
  const account1Data = await getAccount(account1);
  console.log(chalk.bgGreen.black(` A conta ${account1} tem o saldo de R$${account1Data.balance} `));

  // Pega o valor da conta quer vai receber a transferencia
  const { account2 } = await inquirer.prompt([
    {
      name: 'account2',
      message: chalk.bold(helpMsg) + '  \n Qual conta você deseja transferir: '
    }
  ]);

  if (account2 == account1) {
    console.log(chalk.bgRed.black(' Você não pode transferir valor para mesma conta que deseja sacar '));
    return transfer();
  }
  if (await accountExist(account2) == false) {
    console.log(chalk.bgRed.black(' Essa conta não existe, escolha uma conta que existe '));
    return transfer();
  }
  const account2Data = await getAccount(account2);
  console.log(chalk.bgGreen.black(` A conta ${account2} tem o saldo de R$${account2Data.balance} `));

  await transferValue(account1, account2);
}

async function transferValue(acc1, acc2) {
  // Pega valor a ser transferido
  const { amount } = await inquirer.prompt([
    {
      name: 'amount',
      message: 'Qual valor a ser transferido'
    }
  ]);

  const account1Data = await getAccount(acc1);
  const account2Data = await getAccount(acc2);

  if (!amount || amount > account1Data.balance || !regex.test(amount)) {
    console.log(chalk.bgRed.black(' Ocorreu um erro! Valor impossível de ser transferido '));
    return transferValue(acc1, acc2);
  }

  account1Data.balance = parseFloat(account1Data.balance) - parseFloat(amount);
  account2Data.balance = parseFloat(account2Data.balance) + parseFloat(amount);

  await fs.writeFile(
    `${ACCOUNTS_DIR}/${acc1}.json`,
    JSON.stringify(account1Data)
  );

  await fs.writeFile(
    `${ACCOUNTS_DIR}/${acc2}.json`,
    JSON.stringify(account2Data)
  );

  console.log(chalk.bgGreen.black.bold(` A transferencia do valor de R$${amount} de ${acc1} para ${acc2} foi concluída com sucesso! `));
  const transferLog = `Transferencia efetuada com sucesso no valor de R$${amount} de ${acc1} para ${acc2} | ${getHour()} \n`;
  await fs.appendFile(
    `${LOGS_DIR}/transferencias.txt`,
    transferLog
  );
  await operation();
}

function getHour() {
  const day = new Date().toLocaleDateString();
  const hour = new Date().toLocaleTimeString();
  return `${day} ${hour}`;
}

// Função para limpar a tela
async function clearScreen() {
  console.clear();
  await operation();
}

// Inicia a operação do banco
operation().catch(handleError);
