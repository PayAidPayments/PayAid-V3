# Email Step 4.1 Runtime Smoke

- Timestamp: 2026-04-24T18:39:48.449Z
- BASE_URL: https://payaid-v3.vercel.app
- TENANT_ID: cmjptk2mw0000aocw31u48n64
- EMAIL_CAMPAIGN_ID: cmoczj4oi0001kax6e3a13lvz
- EMAIL_RETRY_JOB_ID: [not set]
- AUTH_TOKEN present: yes

## Endpoint checks

- progress: FAIL (GET 404 in 409ms)
- failed-jobs: FAIL (GET 404 in 529ms)
- retry-history: FAIL (GET 404 in 40ms)

## Raw responses

### progress

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/progress?tenantId=cmjptk2mw0000aocw31u48n64
- Method: GET
- Status: 404
- Duration ms: 409

```text
<!DOCTYPE html><!--QH3mgvQ0IS11SAouLHzgG--><html lang="en" class="light"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5"/><link rel="stylesheet" href="/_next/static/chunks/2b7667dc721182a8.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/16c50455f1482ec9.js"/><script src="/_next/static/chunks/6ad51d28769f04a3.js" async=""></script><script src="/_next/static/chunks/0cf5bba9c0cde479.js" async=""></script><script src="/_next/static/chunks/1cd55cfe85f4b5a5.js" async=""></script><script src="/_next/static/chunks/797fcb0710da3be2.js" async=""></script><script src="/_next/static/chunks/turbopack-92dc0959ad26f90b.js" async=""></script><script src="/_next/static/chunks/9afdbc217bafe2fb.js" async=""></script><script src="/_next/static/chunks/5625ec393670393d.js" async=""></script><link rel="dns-prefetch" href="https://unpkg.com"/><link rel="dns-prefetch" href="https://prod.spline.design"/><link rel="preconnect" href="https://unpkg.com" crossorigin="anonymous"/><link rel="preconnect" href="https://prod.spline.design" crossorigin="anonymous"/><meta name="robots" content="noindex"/><title>PayAid V3 - Business Operating System</title><meta name="description" content="All-in-one business operating system for Indian startups and SMBs"/><link rel="icon" href="/favicon.ico"/><script>
              (function() {
                // FORCE light mode immediately - runs before any rendering
                try {
                  // Remove dark class immediately
                  if (document.documentElement) {
                    document.documentElement.classList.remove('dark');
                  }
                  // Force light mode in localStorage
                  localStorage.setItem('theme', 'light');
                } catch(e) {
                  // If localStorage fails, still remove dark class
                  if (document.documentElement) {
                    document.documentElement.classList.remove('dark');
                  }
                }
              })();
            </script><script src="/_next/static/chunks/a6dad97d9634a72d.js" noModule=""></script></head><body class="font-sans"><div hidden=""><!--$--><!--/$--></div><!--$!--><template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template><!--/$--><script src="/_next/static/chunks/16c50455f1482ec9.js" id="_R_" async=""></script><script>(self.__next_f=self.__next_f||[]).push([0])</script><script>self.__next_f.push([1,"1:\"$Sreact.fragment\"\n2:I[866113,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5625ec393670393d.js\"],\"ClientRoot\"]\n3:I[339756,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5625ec393670393d.js\"],\"default\"]\n4:I[837457,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5625ec393670393d.js\"],\"default\"]\n5:I[897367,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5
```

### failed-jobs

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/failed-jobs?tenantId=cmjptk2mw0000aocw31u48n64&limit=20
- Method: GET
- Status: 404
- Duration ms: 529

```text
<!DOCTYPE html><!--QH3mgvQ0IS11SAouLHzgG--><html lang="en" class="light"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5"/><link rel="stylesheet" href="/_next/static/chunks/2b7667dc721182a8.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/16c50455f1482ec9.js"/><script src="/_next/static/chunks/6ad51d28769f04a3.js" async=""></script><script src="/_next/static/chunks/0cf5bba9c0cde479.js" async=""></script><script src="/_next/static/chunks/1cd55cfe85f4b5a5.js" async=""></script><script src="/_next/static/chunks/797fcb0710da3be2.js" async=""></script><script src="/_next/static/chunks/turbopack-92dc0959ad26f90b.js" async=""></script><script src="/_next/static/chunks/9afdbc217bafe2fb.js" async=""></script><script src="/_next/static/chunks/5625ec393670393d.js" async=""></script><link rel="dns-prefetch" href="https://unpkg.com"/><link rel="dns-prefetch" href="https://prod.spline.design"/><link rel="preconnect" href="https://unpkg.com" crossorigin="anonymous"/><link rel="preconnect" href="https://prod.spline.design" crossorigin="anonymous"/><meta name="robots" content="noindex"/><title>PayAid V3 - Business Operating System</title><meta name="description" content="All-in-one business operating system for Indian startups and SMBs"/><link rel="icon" href="/favicon.ico"/><script>
              (function() {
                // FORCE light mode immediately - runs before any rendering
                try {
                  // Remove dark class immediately
                  if (document.documentElement) {
                    document.documentElement.classList.remove('dark');
                  }
                  // Force light mode in localStorage
                  localStorage.setItem('theme', 'light');
                } catch(e) {
                  // If localStorage fails, still remove dark class
                  if (document.documentElement) {
                    document.documentElement.classList.remove('dark');
                  }
                }
              })();
            </script><script src="/_next/static/chunks/a6dad97d9634a72d.js" noModule=""></script></head><body class="font-sans"><div hidden=""><!--$--><!--/$--></div><!--$!--><template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template><!--/$--><script src="/_next/static/chunks/16c50455f1482ec9.js" id="_R_" async=""></script><script>(self.__next_f=self.__next_f||[]).push([0])</script><script>self.__next_f.push([1,"1:\"$Sreact.fragment\"\n2:I[866113,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5625ec393670393d.js\"],\"ClientRoot\"]\n3:I[339756,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5625ec393670393d.js\"],\"default\"]\n4:I[837457,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5625ec393670393d.js\"],\"default\"]\n5:I[897367,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5
```

### retry-history

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/retry-history?tenantId=cmjptk2mw0000aocw31u48n64&limit=20
- Method: GET
- Status: 404
- Duration ms: 40

```text
<!DOCTYPE html><!--QH3mgvQ0IS11SAouLHzgG--><html lang="en" class="light"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5"/><link rel="stylesheet" href="/_next/static/chunks/2b7667dc721182a8.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/16c50455f1482ec9.js"/><script src="/_next/static/chunks/6ad51d28769f04a3.js" async=""></script><script src="/_next/static/chunks/0cf5bba9c0cde479.js" async=""></script><script src="/_next/static/chunks/1cd55cfe85f4b5a5.js" async=""></script><script src="/_next/static/chunks/797fcb0710da3be2.js" async=""></script><script src="/_next/static/chunks/turbopack-92dc0959ad26f90b.js" async=""></script><script src="/_next/static/chunks/9afdbc217bafe2fb.js" async=""></script><script src="/_next/static/chunks/5625ec393670393d.js" async=""></script><link rel="dns-prefetch" href="https://unpkg.com"/><link rel="dns-prefetch" href="https://prod.spline.design"/><link rel="preconnect" href="https://unpkg.com" crossorigin="anonymous"/><link rel="preconnect" href="https://prod.spline.design" crossorigin="anonymous"/><meta name="robots" content="noindex"/><title>PayAid V3 - Business Operating System</title><meta name="description" content="All-in-one business operating system for Indian startups and SMBs"/><link rel="icon" href="/favicon.ico"/><script>
              (function() {
                // FORCE light mode immediately - runs before any rendering
                try {
                  // Remove dark class immediately
                  if (document.documentElement) {
                    document.documentElement.classList.remove('dark');
                  }
                  // Force light mode in localStorage
                  localStorage.setItem('theme', 'light');
                } catch(e) {
                  // If localStorage fails, still remove dark class
                  if (document.documentElement) {
                    document.documentElement.classList.remove('dark');
                  }
                }
              })();
            </script><script src="/_next/static/chunks/a6dad97d9634a72d.js" noModule=""></script></head><body class="font-sans"><div hidden=""><!--$--><!--/$--></div><!--$!--><template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template><!--/$--><script src="/_next/static/chunks/16c50455f1482ec9.js" id="_R_" async=""></script><script>(self.__next_f=self.__next_f||[]).push([0])</script><script>self.__next_f.push([1,"1:\"$Sreact.fragment\"\n2:I[866113,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5625ec393670393d.js\"],\"ClientRoot\"]\n3:I[339756,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5625ec393670393d.js\"],\"default\"]\n4:I[837457,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5625ec393670393d.js\"],\"default\"]\n5:I[897367,[\"/_next/static/chunks/9afdbc217bafe2fb.js\",\"/_next/static/chunks/5
```

