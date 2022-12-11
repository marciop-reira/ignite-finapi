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

app.put("/accounts/:id", verifyIfAccountExists, function (request, response) {
  const { account } = request;
  const { name } = request.body;

  if (name) {
    account.name = name;
  }

  return response.status(200).json(account);
});

app.get("/accounts/:id", verifyIfAccountExists, function (request, response) {
  const { account } = request;

  return response.json(account);
});

app.delete("/accounts/:id", verifyIfAccountExists, function (request, response) {
  const { account } = request;

  accounts.splice(account, 1);

  return response.status(200).send();
});

app.get('/accounts/:id/statement', verifyIfAccountExists, function (request, response) {
  const { account } = request;
  const { date } = request.query;
  let statement = account.statement;

  if (date) {
    const dateFormat = new Date(date + ' 00:00');
    statement = statement.filter(statement => statement.create_at.toDateString() === dateFormat.toDateString());
  }

  response.json(statement);
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

app.get("/accounts/:id/balance", verifyIfAccountExists, function (request, response) {
  const { account } = request;
  const balance = getBalance(account.statement);

  return response.json(balance);
});

app.listen(3333);