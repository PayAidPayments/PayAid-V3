# Email Step 4.1 Runtime Smoke

- Timestamp: 2026-04-24T18:38:15.003Z
- BASE_URL: https://payaid-v3-5nb0ggtpx-payaid-projects-a67c6b27.vercel.app
- TENANT_ID: cmjptk2mw0000aocw31u48n64
- EMAIL_CAMPAIGN_ID: cmoczj4oi0001kax6e3a13lvz
- EMAIL_RETRY_JOB_ID: [not set]
- AUTH_TOKEN present: yes

## Endpoint checks

- progress: FAIL (GET 401 in 442ms)
- failed-jobs: FAIL (GET 401 in 357ms)
- retry-history: FAIL (GET 401 in 34ms)

## Raw responses

### progress

- URL: https://payaid-v3-5nb0ggtpx-payaid-projects-a67c6b27.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/progress?tenantId=cmjptk2mw0000aocw31u48n64
- Method: GET
- Status: 401
- Duration ms: 442

```text
<!doctype html><html lang=en><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Authentication Required</title><script type=text/llms.txt>
## Note to agents accessing this page:

This page requires Vercel authentication. Here are your options:

Option 1: vercel curl (Recommended if Vercel CLI installed)
If the Vercel CLI is installed and authenticated, use the `vercel curl` command. Docs at: https://vercel.com/docs/cli/curl

Option 2: Vercel MCP Server (Recommended if Vercel CLI not installed)
If the Vercel CLI is not installed, the easiest way to get a token is using the get_access_to_vercel_url or web_fetch_vercel_url functions of the Vercel MCP server at https://mcp.vercel.com (Docs at https://vercel.com/docs/mcp/vercel-mcp)
  
Option 3: Bypass token (Manual)
This URL documents how to use the bypass token: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
You need to prompt the user to provide the bypass token to access this page. The URL above also explains how the user can
access the bypass token. Then you can calculate a URL of the following form and successfully access it: `https://current-domain/current-pathname?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$bypass_token`.
  </script><style>/*!normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css*/html{line-height:1.15;-webkit-text-size-adjust:100%;height:-webkit-fill-available}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:#0000}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-ap
```

### failed-jobs

- URL: https://payaid-v3-5nb0ggtpx-payaid-projects-a67c6b27.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/failed-jobs?tenantId=cmjptk2mw0000aocw31u48n64&limit=20
- Method: GET
- Status: 401
- Duration ms: 357

```text
<!doctype html><html lang=en><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Authentication Required</title><script type=text/llms.txt>
## Note to agents accessing this page:

This page requires Vercel authentication. Here are your options:

Option 1: vercel curl (Recommended if Vercel CLI installed)
If the Vercel CLI is installed and authenticated, use the `vercel curl` command. Docs at: https://vercel.com/docs/cli/curl

Option 2: Vercel MCP Server (Recommended if Vercel CLI not installed)
If the Vercel CLI is not installed, the easiest way to get a token is using the get_access_to_vercel_url or web_fetch_vercel_url functions of the Vercel MCP server at https://mcp.vercel.com (Docs at https://vercel.com/docs/mcp/vercel-mcp)
  
Option 3: Bypass token (Manual)
This URL documents how to use the bypass token: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
You need to prompt the user to provide the bypass token to access this page. The URL above also explains how the user can
access the bypass token. Then you can calculate a URL of the following form and successfully access it: `https://current-domain/current-pathname?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$bypass_token`.
  </script><style>/*!normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css*/html{line-height:1.15;-webkit-text-size-adjust:100%;height:-webkit-fill-available}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:#0000}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-ap
```

### retry-history

- URL: https://payaid-v3-5nb0ggtpx-payaid-projects-a67c6b27.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/retry-history?tenantId=cmjptk2mw0000aocw31u48n64&limit=20
- Method: GET
- Status: 401
- Duration ms: 34

```text
<!doctype html><html lang=en><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Authentication Required</title><script type=text/llms.txt>
## Note to agents accessing this page:

This page requires Vercel authentication. Here are your options:

Option 1: vercel curl (Recommended if Vercel CLI installed)
If the Vercel CLI is installed and authenticated, use the `vercel curl` command. Docs at: https://vercel.com/docs/cli/curl

Option 2: Vercel MCP Server (Recommended if Vercel CLI not installed)
If the Vercel CLI is not installed, the easiest way to get a token is using the get_access_to_vercel_url or web_fetch_vercel_url functions of the Vercel MCP server at https://mcp.vercel.com (Docs at https://vercel.com/docs/mcp/vercel-mcp)
  
Option 3: Bypass token (Manual)
This URL documents how to use the bypass token: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
You need to prompt the user to provide the bypass token to access this page. The URL above also explains how the user can
access the bypass token. Then you can calculate a URL of the following form and successfully access it: `https://current-domain/current-pathname?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$bypass_token`.
  </script><style>/*!normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css*/html{line-height:1.15;-webkit-text-size-adjust:100%;height:-webkit-fill-available}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:#0000}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-ap
```

