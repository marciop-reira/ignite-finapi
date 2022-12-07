const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const accounts = [];

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

app.get('/accounts/:id/statement', function (request, response) {
  const { id } = request.params;

  const account = accounts.find(account => account.id === id);

  if (!account) {
    return response.status(404).send({
      error: 'Account not found.'
    });
  }

  return response.json(account.statement);
});

app.listen(3333);