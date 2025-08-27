# ✉️ Managing Mail

CandyPack includes a mail server and provides a set of commands to manage email accounts for your domains. The `mail` command is the entry point for all mail-related operations.

## Create a Mail Account
This command allows you to create a new email account.

### Usage
```bash
candy mail create
```
You will be prompted to enter the new email address and a password for the account.

## Delete a Mail Account
This command removes an existing email account.

### Usage
```bash
candy mail delete
```
You will be prompted to enter the email address you wish to delete.

## List Mail Accounts
This command lists all email accounts associated with a specific domain.

### Usage
```bash
candy mail list
```
You will be prompted to enter the domain name (e.g., `example.com`) to see all its email accounts.

## Change Account Password
This command allows you to change the password for an existing email account.

### Usage
```bash
candy mail password
```
You will be prompted to enter the email address and the new password.
