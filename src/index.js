const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const accounts = [];

function verifyIfAccountExists(request, response, next) {
  const { id } = request.params;

  const account = accounts.find(account => account.id === id);

  if (!account) {
    return response.status(404).send({
      error: 'Account not found.'
    });
  }

  request.account = account;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    return acc + (
      (operation.type === 'credit')
        ? operation.amount
        : -operation.amount
    );
  }, 0);

  return balance;
}

app.post("/accounts", function (request, response) {
  const { cpf, name } = request.body;

  const accountAlreadyExists = accounts.some((account) => account.cpf === cpf);

  if (accountAlreadyExists) {
    return response.status(400).send({
      error: 'There is already an account linked to this cpf.'
    });
  }

  const account = {
    id: uuidv4(),
    cpf,
    name,
    statement: []
  };

  accounts.push(account);

  return response.status(201).json(account);
});

app.get('/accounts/:id/statement', verifyIfAccountExists, function (request, response) {
  const { account } = request;

  response.json(account.statement);
});

app.post('/accounts/:id/deposit', verifyIfAccountExists, function (request, response) {
  const { account } = request;
  const { amount, description } = request.body;

  const statementOpration = {
    amount,
    description,
    type: 'credit',
    create_at: new Date()
  };

  account.statement.push(statementOpration);

  return response.status(201).send();
});

app.post('/accounts/:id/withdraw', verifyIfAccountExists, function (request, response) {
  const { account } = request;
  const { amount } = request.body;

  if (getBalance(account.statement) < amount) {
    return response.status(400).send({
      error: 'Insufficient funds.'
    })
  }

  const statementOpration = {
    amount,
    type: 'debit',
    create_at: new Date()
  };

  account.statement.push(statementOpration);

  return response.status(201).send();
});

app.listen(3333);