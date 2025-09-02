# Managing SSL

CandyPack automates the process of obtaining and renewing SSL certificates for your websites, ensuring they are always served over a secure HTTPS connection.

While this process is largely automatic, you can manually trigger a renewal for a specific domain using the `ssl` command.

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
