## 🔒 Renew an SSL Certificate
This command attempts to renew the SSL certificate for a given domain. This can be useful if a certificate is close to expiring and you want to force an early renewal.

### Usage
```bash
candy ssl renew
```
After running the command, you will be prompted to enter the domain name for which you want to renew the SSL certificate.

### Example
```bash
$ candy ssl renew
> Enter the domain name: example.com
```

CandyPack will then handle the process of validating your domain and renewing the certificate.
