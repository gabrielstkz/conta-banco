const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;

const ACCOUNTS_DIR = 'accounts';
const regex = /^\d+$/;

// Função principal que controla as operações do banco
async function operation() {
  try {
    // Pergunta ao usuário qual operação ele deseja realizar
    const { action } = await inquirer.prompt([
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
    ]);

    // Executa a operação selecionada pelo usuário
    switch (action) {
      case 'Criar Conta':
        await createAccount();
        break;
      case 'Mostrar Contas':
        await showAccounts();
        break;
      case 'Depositar':
        await deposit();
        break;
      case 'Sacar':
        await withdraw();
        break;
      case 'Consultar Saldo':
        await getAccountBalance();
        break;
      case 'Limpar Tela':
        console.clear();
        await operation();
        break;
      case 'Sair':
        console.log(chalk.bgBlue.black.bold(' Obrigado por usar nosso banco :) '));
        process.exit();
    }
  } catch (err) {
    console.log(err);
  }
}

// Função para criar uma nova conta
async function createAccount() {
  console.log(chalk.bgGreen.black(' Obrigado por escolher nosso banco '));
  console.log(chalk.green(' Defina as opções da conta a seguir '));
  await buildAccount();
}

// Função para construir uma nova conta
async function buildAccount() {
  try {
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
  } catch (err) {
    console.log(err);
  }
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

// Função para adicionar um valor ao saldo da conta
async function addAmount(accountName, amount) {
  try {
    // Verifica se o valor informado é válido
    if (!amount || amount < 0 || !regex.test(amount)) {
      throw new Error('Ocorreu um erro! Valor impossível de ser depositado');
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
  } catch (err) {
    console.log(chalk.red(err.message));
  }
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
  try {
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
    console.log(chalk.bgBlueBright.black(` A conta ${accountName} tem o saldo de R$${accountData.balance} `))
    await operation();
  } catch (err) {
    console.log(err);
  }
}

// Função para listar todas as contas existentes
async function showAccounts() {
  try {
    // Lê o diretório "accounts" e lista os arquivos de contas
    const files = await fs.readdir(ACCOUNTS_DIR);
    let i = 0;
    files.forEach(file => {
      i++;
      file = file.replace('.json', '');
      console.log(chalk.cyan.bold(`  Conta número ${i}: ${file}`));
    });
    await operation();
  } catch (err) {
    console.log(err);
  }
}

// Função para realizar um depósito em uma conta
async function deposit() {
  try {
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
    await operation();
  } catch (err) {
    console.log(err);
  }
}

// Função para realizar um saque de uma conta
async function withdraw() {
  try {
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
    await operation();
  } catch (err) {
    console.log(err);
  }
}

// Função para remover um valor do saldo da conta
async function removeAmount(accountName, amount) {
  try {
    // Obtém os dados da conta
    const accountData = await getAccount(accountName);

    // Verifica se o valor informado é válido
    if (!amount || amount > accountData.balance || !regex.test(amount)) {
      throw new Error('Ocorreu um erro! Valor impossível de ser sacado');
    }

    accountData.balance = parseFloat(accountData.balance) - parseFloat(amount);

    // Salva os novos dados da conta no arquivo
    await fs.writeFile(
      `${ACCOUNTS_DIR}/${accountName}.json`,
      JSON.stringify(accountData)
    );

    console.log(chalk.bgGreen.black(` Saque de R$${amount} feito com sucesso! `));
    console.log(chalk.bgGreen.black(` Saldo de R$${accountData.balance} `));
  } catch (err) {
    console.log(chalk.red(err.message));
  }
}

// Inicia a operação do banco
operation();
