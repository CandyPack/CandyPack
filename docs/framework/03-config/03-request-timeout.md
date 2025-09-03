## ⏱️ Request Timeout

You can configure the global timeout for incoming requests by adding a `request` object to your `config.json`.

```json
"request": {
  "timeout": 10000
}
```

The `timeout` value is in milliseconds. In this example, any request that takes longer than 10,000 milliseconds (10 seconds) to process will be timed out.
